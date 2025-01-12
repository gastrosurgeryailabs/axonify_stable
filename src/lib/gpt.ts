import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const defaultOpenAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function getOpenAIClient(apiKey?: string) {
  if (apiKey) {
    return new OpenAI({ apiKey });
  }
  return defaultOpenAI;
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
  model: string = "gpt-3.5-turbo",
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false,
  apiKey?: string
): Promise<any> {
  const openai = getOpenAIClient(apiKey);
  console.log("OpenAI client initialized for model:", model);
  const list_input = Array.isArray(user_prompt);
  const dynamic_elements = /<.*?>/.test(JSON.stringify(output_format));
  const list_output = /\[.*?\]/.test(JSON.stringify(output_format));
  let error_msg = "";

  for (let i = 0; i < num_tries; i++) {
    try {
      let output_format_prompt = `\nYou are to output the following in json format: ${JSON.stringify(output_format)}. \nDo not put quotation marks or escape character \\ in the output fields.`;

      if (list_output) {
        output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
      }
      if (dynamic_elements) {
        output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
      }
      if (list_input) {
        output_format_prompt += `\nGenerate a list of json, one json for each input element.`;
      }

      const messages = [
        {
          role: "system" as const,
          content: system_prompt + output_format_prompt + error_msg + "\nIMPORTANT: For multiple items, wrap them in a JSON array []",
        },
        {
          role: "user" as const,
          content: Array.isArray(user_prompt) ? user_prompt.join('\n') : user_prompt,
        },
      ];

      console.log("Preparing OpenAI request for model:", model);
      console.log("Request configuration:", {
        model,
        temperature,
        messageCount: messages.length,
        systemPromptLength: messages[0].content.length,
        userPromptLength: messages[1].content.length
      });

      const response = await openai.chat.completions.create({
        model,
        temperature,
        messages,
      });

      console.log("OpenAI response received from model:", model);
      console.log("Response metadata:", {
        model: response.model, // This will show the actual model used
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens
      });

      const res = response.choices[0].message?.content;
      if (!res) {
        throw new Error("No response content from OpenAI");
      }

      console.log("Processing response from model:", model);

      try {
        // Try to parse as is first
        try {
          let output: any = JSON.parse(res);
          if (list_input && !Array.isArray(output)) {
            throw new Error("Expected array output for list input");
          }
          return list_input ? output : output[0];
        } catch (parseError) {
          // If parsing fails, try to fix common issues
          let cleanedRes = res
            .trim()
            // Remove any markdown code block syntax
            .replace(/```json\n?|```\n?/g, '')
            // If we have multiple JSON objects separated by newlines, wrap them in an array
            .split(/\n+/)
            .filter(line => line.trim())
            .join(',');
            
          if (!cleanedRes.startsWith('[')) {
            cleanedRes = `[${cleanedRes}]`;
          }

          let output: any = JSON.parse(cleanedRes);
          if (!Array.isArray(output)) {
            throw new Error("Expected array output");
          }

          // Validate output format
          for (const item of output) {
            for (const key in output_format) {
              if (!item[key]) {
                throw new Error(`Missing required key: ${key}`);
              }
            }
          }

          return list_input ? output : output[0];
        }
      } catch (parseError: any) {
        console.error("Error parsing OpenAI response:", parseError);
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

export async function getQuizQuestion(topic: string, customPrompt: string, model: string = "gpt-3.5-turbo", apiKey?: string) {
  const response = await strict_output(
    customPrompt,
    `Generate a multiple choice question about ${topic}`,
    {
      question: "string",
      options: ["string", "string", "string", "string"],
      answer: "string"
    },
    "",
    false,
    model,
    0.7,
    3,
    false,
    apiKey
  );

  return response;
}

export async function getOpenEndedQuestion(topic: string, customPrompt: string, model: string = "gpt-3.5-turbo", apiKey?: string) {
  const response = await strict_output(
    customPrompt,
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

export default defaultOpenAI;