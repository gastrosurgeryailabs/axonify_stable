// AnythingLLM client configuration
const ANYTHING_LLM_URL = process.env.NEXT_PUBLIC_ANYTHING_LLM_URL || 'http://localhost:3001';

// Helper function to make requests to AnythingLLM
async function makeAnythingLLMRequest(messages: any[], temperature: number = 1, model: string = 'demo', apiKey?: string) {
  try {
    // Special handling for Ollama models to encourage array output
    if (model.toLowerCase().includes('llama') || model.toLowerCase().includes('mixtral')) {
      messages[0].content += "\nIMPORTANT: You must generate multiple separate JSON objects, one for each question. Each object should be complete and valid JSON.";
    }

    if (!apiKey) {
      throw new Error('AnythingLLM API key is required');
    }

    // Add CORS headers for cross-origin requests
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    const response = await fetch(`${ANYTHING_LLM_URL}/api/v1/openai/chat/completions`, {
      method: 'POST',
      headers,
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

      // Add special handling for Llama models specifically
      if (model.toLowerCase().includes('llama')) {
        system_prompt = `You are a helpful AI that generates high-quality quiz questions. For each question:
- Generate complete, meaningful statements for all options
- Keep all options between 5-15 words
- No prefixes or numbers before options
- No explanations or hints in any option
- Make all options similar in length and style

${system_prompt}`;

        output_format_prompt = `\nYou must output EXACTLY ${Array.isArray(user_prompt) ? user_prompt.length : 1} questions in this JSON format:
{
  "question": "string",
  "answer": "string",
  "incorrectAnswers": ["string", "string", "string"]
}

CRITICAL RULES:
1. Output must be valid JSON
2. If multiple questions, wrap them in an array: [{ question1 }, { question2 }]
3. Each incorrectAnswers array must have exactly 3 items
4. No markdown, no code blocks, no extra text
5. No prefixes (a, b, c, 1, 2, 3) in any option
6. No explanations in any option\n`;
      }
      // Add special handling for DeepSeek model
      else if (model.toLowerCase().includes('deepseek')) {
        output_format_prompt += `\nVery important for DeepSeek model:
1. You MUST generate the EXACT number of questions specified
2. Each question MUST be a separate JSON object
3. NEVER use single letters, numbers, or abbreviated options
4. ALL options MUST be complete, descriptive statements:
   * Write out the full answer as a proper statement
   * No single words or letters
   * No abbreviations
   * Each option should be a complete thought
5. The correct answer MUST match the style of incorrect answers:
   * Same length and detail level as other options
   * No additional explanations
   * No special formatting
   * Just a clear, complete statement
6. ALL options (correct and incorrect) must:
   * Be complete, meaningful statements
   * Contain 5-15 words
   * Be similar in length and style
   * Not reveal which is correct
7. For sequence/order questions:
   * Write out the complete sequence
   * Don't use single letters or numbers
   * Each option should be a full description of the order
8. Output must be an array of question objects\n`;

        // Modify the system prompt for DeepSeek
        system_prompt += `\nSpecial instructions for DeepSeek:
- Generate multiple separate questions as an array
- Each question must be a complete JSON object
- NEVER use single letters or numbers as options
- ALL options must be complete, meaningful statements
- Write out full answers instead of abbreviations
- For sequence questions, write complete sequences
- Every option should be equally detailed and well-formed
- No option should stand out as more or less detailed than others\n`;
      }

      if (list_output) {
        output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
      }
      if (dynamic_elements) {
        output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
      }
      if (list_input) {
        output_format_prompt += `\nGenerate a list of json, one json for each input element.`;
      }

      // Add special handling for other models
      if (model.toLowerCase().includes('mixtral') || 
          model.toLowerCase().includes('gemini')) {
        output_format_prompt = `\nVery important: You must respond ONLY with a valid JSON object.
Do not include any other text, markdown, or explanations.
The JSON must exactly match this format: ${JSON.stringify(output_format)}

Rules for JSON output:
1. Must be valid, parseable JSON
2. No text before or after the JSON
3. No markdown code blocks
4. No quotation marks or escape characters in output fields
5. ONLY output the JSON object itself
6. For multiple questions, wrap them in a JSON array []\n` + output_format_prompt;
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
          // Special handling for Llama models to always return array of questions
          if (model.toLowerCase().includes('llama')) {
            return Array.isArray(output) ? output : [output];
          }
          // Original handling for other models
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
              model.toLowerCase().includes('gemini') ||
              model.toLowerCase().includes('deepseek')) {
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
            // Special handling for Llama models to always return array of questions
            if (model.toLowerCase().includes('llama')) {
              return Array.isArray(output) ? output : [output];
            }
            // Original handling for other models
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

1. MOST IMPORTANT: You MUST generate EXACTLY the number of questions specified in the amount field - no more, no less.
2. Each question must be clear, complete, and engaging
3. For MCQ questions:
   - Present a clear question
   - Generate exactly 4 options for each question
   - All options must be plausible and relevant to the topic
   - ABSOLUTELY NO PREFIXES of any kind before options:
     * NO letters (a, b, c, d, A, B, C, D)
     * NO numbers (1, 2, 3, 4)
     * NO symbols (-, *, •, >, etc.)
     * NO parentheses with letters or numbers (a), (1), etc.)
   - ABSOLUTELY NO EXPLANATIONS in ANY option:
     * NO explanatory text in correct answer
     * NO phrases like "because", "since", "as", "due to"
     * NO reasoning or justification in any option
     * NO additional context or clarification
   - Keep all options as simple, direct statements
   - All options must be similar in length (10-15 words maximum)
   - Randomize the position of the correct answer
4. For open-ended questions:
   - Keep answers concise and clear

CRITICAL: 
- You MUST generate EXACTLY the number of questions specified in the amount field
- NEVER include explanations in ANY option, even correct ones
- ALL options must be simple statements without any reasoning
- NO prefixes or markers of ANY KIND before options
- NO hint words in any options
- Keep all options under 15 words
- Each question must be independent and unique

Format each question as a complete, valid JSON object with 'question', 'answer', and 'incorrectAnswers' fields.`;

interface QuizQuestion {
  question: string;
  answer: string;
  incorrectAnswers: string[];
}

export async function getQuizQuestion(topic: string, customPrompt: string, model: string = "default", apiKey?: string) {
  // Extract number of questions from customPrompt if it exists
  const numQuestionsMatch = customPrompt.match(/(\d+)\s*questions?/i);
  const numQuestions = numQuestionsMatch ? parseInt(numQuestionsMatch[1]) : 1;
  
  // Create an array of prompts to force array output
  const prompts = Array(numQuestions).fill(
    `Generate a multiple choice question about ${topic}. 
    IMPORTANT: Keep all answer options short and direct. NO explanations or reasoning in any option.`
  );

  const response = await strict_output(
    SYSTEM_QUIZ_PROMPT,
    prompts,
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

  // Ensure we have an array of questions
  const questions = Array.isArray(response) ? response : [response];

  // Strict validation for question count
  if (questions.length !== numQuestions) {
    console.error(`Question count mismatch. Expected: ${numQuestions}, Got: ${questions.length}`);
    throw new Error(`Must generate exactly ${numQuestions} questions`);
  }

  // Transform and validate each question
  return questions.map((res: QuizQuestion) => {
    // Clean options by removing prefixes, hint words, and explanations
    const cleanOption = (opt: string) => {
      let cleaned = opt
        .replace(/^[A-Da-d][).]\s*|^\d+[).]\s*/, '') // Remove prefixes
        .replace(/\b(correct|right|true|answer|this is|the correct)\b.*$/i, '') // Remove hint phrases
        .replace(/^(this is|the correct|the right|the answer|correct answer|right answer|true answer).*$/i, '') // Remove starting hints
        .replace(/\s*(because|since|as|therefore|thus|hence|due to|explains why).*$/i, '') // Remove explanations
        .replace(/^(.*?),.*$/, '$1') // Remove everything after first comma (likely explanations)
        .replace(/^(.*?)\s+(?:because|since|as|which|when|where|due to).*$/i, '$1') // Remove explanatory clauses
        .trim();
      
      // If cleaning made it empty, return original trimmed
      return cleaned || opt.trim();
    };
    
    return {
      question: res.question,
      answer: cleanOption(res.answer),
      options: [cleanOption(res.answer), ...res.incorrectAnswers.map(cleanOption)].sort(() => Math.random() - 0.5)
    };
  });
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