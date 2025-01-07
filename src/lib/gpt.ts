import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  verbose: boolean = false
): Promise<any> {
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

      console.log("Sending request to OpenAI with:", {
        model,
        system_prompt: system_prompt + output_format_prompt + error_msg,
        user_prompt: Array.isArray(user_prompt) ? user_prompt.join('\n') : user_prompt
      });

      const response = await openai.chat.completions.create({
        model,
        temperature,
        messages: [
          {
            role: "system",
            content: system_prompt + output_format_prompt + error_msg + "\nIMPORTANT: For multiple items, wrap them in a JSON array []",
          },
          {
            role: "user",
            content: Array.isArray(user_prompt) ? user_prompt.join('\n') : user_prompt,
          },
        ],
      });

      const res = response.choices[0].message?.content;
      if (!res) {
        throw new Error("No response content from OpenAI");
      }

      console.log("OpenAI response:", res);

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

export async function getQuizQuestion(topic: string) {
  const systemPrompt = "You are a quiz generator. Create multiple-choice questions with short, concise answers. The correct answer should be a single word or very short phrase.";
  
  const format = {
    question: "string",
    options: ["string", "string", "string", "string"],
    answer: "string"  // This should be just the correct answer word/phrase
  };

  const response = await strict_output(
    systemPrompt,
    `Generate a multiple choice question about ${topic}`,
    format,
    "",     // default_category
    false,  // output_value_only
    "gpt-3.5-turbo",
    0.7,    // Lower temperature for more focused responses
    3       // num_tries
  );

  return response;
}

export async function getOpenEndedQuestion(topic: string) {
  const systemPrompt = "You are a quiz generator. Create open-ended questions. The answer must be a single word or very short phrase (maximum 2-3 words). Never provide explanations in the answer.";
  
  const format = {
    question: "string",
    answer: "string" // Will contain just the word/short phrase
  };

  const response = await strict_output(
    systemPrompt,
    `Generate an open-ended question about ${topic}. The answer must be a single word or very short phrase.`,
    format,
    "",     // default_category
    false,  // output_value_only
    "gpt-3.5-turbo",
    0.5,    // Even lower temperature for more precise responses
    3       // num_tries
  );

  return response;
}

export default openai;