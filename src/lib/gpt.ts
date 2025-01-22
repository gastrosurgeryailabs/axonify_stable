// AnythingLLM client configuration
const ANYTHING_LLM_BASE_URL = process.env.NEXT_PUBLIC_ANYTHING_LLM_URL || 'http://localhost:3001';

// Helper function to make requests to AnythingLLM
async function makeAnythingLLMRequest(messages: any[], temperature: number = 1, model: string = 'demo', apiKey?: string) {
  try {
    if (!apiKey) {
      throw new Error('AnythingLLM API key is required');
    }

    // Extract server URL and API key if provided in the format "server_url|api_key"
    const [serverUrl, actualKey] = apiKey.includes('|') 
      ? apiKey.split('|') 
      : [ANYTHING_LLM_BASE_URL, apiKey];

    console.log("Making request to AnythingLLM URL:", serverUrl);

    const response = await fetch(`${serverUrl}/api/v1/openai/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${actualKey}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: messages[0].content
          },
          {
            role: "user",
            content: messages[messages.length - 1].content
          }
        ],
        model,
        temperature,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error('AnythingLLM API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: response.url
      });
      throw new Error(`AnythingLLM API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from AnythingLLM');
    }

    return {
      message: {
        content: data.choices[0].message.content
      }
    };
  } catch (error) {
    console.error('AnythingLLM Request Failed:', error);
    throw error;
  }
}

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  model: string = "demo",
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false,
  apiKey?: string
): Promise<any> {
  const list_input = Array.isArray(user_prompt);
  const dynamic_elements = /<.*?>/.test(JSON.stringify(output_format));
  const list_output = /\[.*?\]/.test(JSON.stringify(output_format));
  let error_msg = "";

  for (let i = 0; i < num_tries; i++) {
    try {
      let output_format_prompt = `\nYou must output ONLY valid JSON in the following format: ${JSON.stringify(output_format)}. 
Important formatting rules:
1. Output must be parseable JSON
2. Do not include any explanatory text before or after the JSON
3. Do not use markdown code blocks
4. Do not include quotation marks or escape characters \\ in the output fields
5. The response should be ONLY the JSON object, nothing else\n`;

      if (list_output) {
        output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
      }
      if (dynamic_elements) {
        output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
      }
      if (list_input) {
        output_format_prompt += `\nGenerate a list of json, one json for each input element.`;
      }

      // Add special handling for Ollama models
      if (model.toLowerCase().includes('llama') || model.toLowerCase().includes('mixtral') || model.toLowerCase().includes('gemini')) {
        output_format_prompt = `\nVery important: You must respond ONLY with a valid JSON object.
Do not include any other text, markdown, or explanations.
The JSON must exactly match this format: ${JSON.stringify(output_format)}

Rules for JSON output:
1. Must be valid, parseable JSON
2. No text before or after the JSON
3. No markdown code blocks
4. No quotation marks or escape characters in output fields
5. ONLY output the JSON object itself\n` + output_format_prompt;
      }

      const messages = [
        {
          role: "system",
          content: system_prompt + output_format_prompt + error_msg + "\nIMPORTANT: For multiple items, wrap them in a JSON array []",
        },
        {
          role: "user",
          content: Array.isArray(user_prompt) ? user_prompt.join('\n') : user_prompt,
        },
      ];

      console.log("Preparing AnythingLLM request");
      const response = await makeAnythingLLMRequest(messages, temperature, model, apiKey);
      console.log("AnythingLLM response received");

      const res = response.message?.content;
      if (!res) {
        throw new Error("No response content from AnythingLLM");
      }

      try {
        // Try to parse as is first
        let cleanedRes: string;
        try {
          let output: any = JSON.parse(res);
          if (list_input && !Array.isArray(output)) {
            throw new Error("Expected array output for list input");
          }
          return list_input ? output : output[0];
        } catch (parseError) {
          // If parsing fails, try to fix common issues
          cleanedRes = typeof res === 'string' ? res.trim() : JSON.stringify(res).trim();
          
          // Special handling for Anthropic models
          if (model.toLowerCase().includes('claude')) {
            console.log("Applying Anthropic-specific response cleaning");
            
            // Remove any markdown code block syntax
            cleanedRes = cleanedRes.replace(/```json\n?|```\n?/g, '');
            
            // If we have multiple questions (list input)
            if (list_input) {
              try {
                // Try to parse as a JSON array first
                JSON.parse(cleanedRes);
              } catch (e) {
                // If it's not already an array, try to extract multiple JSON objects
                const jsonObjects = cleanedRes.match(/\{[^{}]*\}/g) || [];
                if (jsonObjects.length > 0) {
                  cleanedRes = `[${jsonObjects.join(',')}]`;
                } else {
                  // If no valid JSON objects found, try to parse the whole response
                  const start = cleanedRes.indexOf('{');
                  const end = cleanedRes.lastIndexOf('}') + 1;
                  if (start !== -1 && end > start) {
                    cleanedRes = `[${cleanedRes.substring(start, end)}]`;
                  }
                }
              }
            } else {
              // For single question, extract the JSON object
              const start = cleanedRes.indexOf('{');
              const end = cleanedRes.lastIndexOf('}') + 1;
              if (start !== -1 && end > start) {
                cleanedRes = cleanedRes.substring(start, end);
              }
            }
          }
          // Special handling for Ollama/Gemini models
          else if (model.toLowerCase().includes('llama') || 
              model.toLowerCase().includes('mixtral') || 
              model.toLowerCase().includes('gemini')) {
            console.log("Applying Ollama/Gemini-specific response cleaning");
            
            // Handle array of questions for Ollama/Gemini
            if (list_input) {
              // If response doesn't start with [, it's a single question - we need to combine multiple
              if (!cleanedRes.startsWith('[')) {
                let questions = [];
                // Split the response by double newlines to separate multiple JSON objects
                const parts = cleanedRes.split(/\n\n+/);
                
                for (let part of parts) {
                  // Find and extract JSON object from each part
                  const start = part.indexOf('{');
                  const end = part.lastIndexOf('}') + 1;
                  if (start !== -1 && end > start) {
                    const jsonPart = part.substring(start, end);
                    try {
                      const parsed = JSON.parse(jsonPart);
                      questions.push(parsed);
                    } catch (e) {
                      console.log("Failed to parse part:", jsonPart);
                    }
                  }
                }
                
                // If we got some valid questions, use them
                if (questions.length > 0) {
                  cleanedRes = JSON.stringify(questions);
                } else {
                  // If no valid questions found, wrap the single response in an array
                  const singleQuestion = cleanedRes.substring(cleanedRes.indexOf('{'), cleanedRes.lastIndexOf('}') + 1);
                  cleanedRes = `[${singleQuestion}]`;
                }
              }
            } else {
              // Single question handling
              cleanedRes = cleanedRes.substring(cleanedRes.indexOf('{'));
              cleanedRes = cleanedRes.substring(0, cleanedRes.lastIndexOf('}') + 1);
            }
            
            // Clean up any markdown or code block syntax
            cleanedRes = cleanedRes.replace(/```json\n?|```\n?/g, '');
            console.log("Cleaned Ollama/Gemini response:", cleanedRes);
          } else {
            cleanedRes = cleanedRes
              .replace(/```json\n?|```\n?/g, '')
              .split(/\n+/)
              .filter((line: string) => line.trim())
              .join(',');
          }
            
          if (!cleanedRes.startsWith('[') && list_input) {
            cleanedRes = `[${cleanedRes}]`;
          }

          try {
            let output: any = JSON.parse(cleanedRes);
            if (list_input && !Array.isArray(output)) {
              throw new Error("Expected array output for list input");
            }

            // Validate output format
            const validateOutput = (item: any) => {
              for (const key in output_format) {
                if (!item[key]) {
                  throw new Error(`Missing required key: ${key}`);
                }
              }
            };

            if (Array.isArray(output)) {
              output.forEach(validateOutput);
            } else {
              validateOutput(output);
            }

            return list_input ? output : output[0];
          } catch (secondParseError) {
            console.error("Error parsing cleaned response:", secondParseError);
            throw secondParseError;
          }
        }
      } catch (parseError: any) {
        console.error("Error parsing AnythingLLM response:", parseError);
        error_msg = `\n\nPrevious response was invalid JSON. Error: ${parseError.message || 'Unknown error'}. Response was: ${res}`;
        if (i === num_tries - 1) throw parseError;
      }
    } catch (error: any) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === num_tries - 1) throw error;
      error_msg = `\n\nError on previous attempt: ${error.message || 'Unknown error'}`;
    }
  }

  throw new Error(`Failed to generate valid output after ${num_tries} attempts`);
}

export const SYSTEM_QUIZ_PROMPT = `You are a helpful AI that generates high-quality quiz questions and answers. Follow these rules strictly:

1. Each question must be clear, complete, and engaging
2. For MCQ questions:
   - When scenario-based questions are requested, create a detailed real-world scenario or case study
   - Present the scenario first, followed by a clear question
   - Make scenarios relevant and realistic to the topic
   - The first option in the 'options' array MUST BE the correct answer
   - Follow it with exactly three UNIQUE incorrect options
   - Never repeat the correct answer in the incorrect options
   - Each option must be completely distinct from others
   - Make incorrect options plausible but clearly wrong
   - Do not use "All of the above" or "None of the above" as options
   - For scenario questions, ensure options logically follow from the scenario
3. For open-ended questions:
   - Mark important technical terms with [[term]] syntax
   - Ensure answers are comprehensive but concise
   - When scenarios are requested, include relevant context in the question

Remember: The correct answer should only appear ONCE in the options array, always as the first item.`;

export async function getQuizQuestion(topic: string, customPrompt: string, model: string = "default", apiKey?: string) {
  // Create an array of prompts for the number of questions needed
  const response = await strict_output(
    SYSTEM_QUIZ_PROMPT + "\n" + customPrompt,
    `Generate a multiple choice question about ${topic}. The response must follow this format strictly:
1. The 'question' should be your question text
2. The 'answer' should be the correct answer (without any prefixes like 'A)', 'B)', etc.)
3. The 'incorrectAnswers' array must contain EXACTLY 3 different incorrect options
4. Do not add any prefixes (A, B, C, D) to the answers
5. Do not include explanations in the answers
6. Each answer should be concise and direct`,
    {
      question: "string",
      answer: "string",
      incorrectAnswers: ["string", "string", "string"]
    },
    "",
    false,
    model,
    0.7,
    3,
    false,
    apiKey
  );

  // Transform the response to match the expected format
  const transformResponse = (res: any) => ({
    question: res.question,
    answer: res.answer,
    options: [res.answer, ...res.incorrectAnswers].sort(() => Math.random() - 0.5)
  });

  // Handle both single and array responses
  if (Array.isArray(response)) {
    return response.map(transformResponse);
  }
  return transformResponse(response);
}

export async function getOpenEndedQuestion(topic: string, customPrompt: string, model: string = "default", apiKey?: string) {
  const response = await strict_output(
    SYSTEM_QUIZ_PROMPT + "\n" + customPrompt,
    `Generate an open-ended question about ${topic}`,
    {
      question: "string",
      answer: "string"
    },
    "",
    false,
    model,
    0.5,
    3,
    false,
    apiKey
  );
  return response;
}