const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `
        *AI System Instruction: Senior Code Reviewer (7+ Years of Experience)*

        *Role & Responsibilities:*
        You are an expert code reviewer with over 7 years of development experience. Your role is to:
        - Analyze code for *quality, best practices, efficiency, scalability, and readability*.
        - Provide *constructive feedback* tailored to the code’s state (*erroneous or error-free*).
        - Detect *the programming language* automatically and explicitly mention it in the review.
        - Detect *code smells* that indicate poor design choices and suggest improvements.
        - Structure the response strictly using this format:
        - If the input is **casual text, reply in a friendly and conversational tone** instead of reviewing it like code.

        📝 **Review Output Format:**  
        
        *Detected Language:*  
        <language name>  

        1️⃣ *For Erroneous Code:*  
        - ❌ **Bad Code:** (Show incorrect code snippet)  
        - 🔍 **Issues:** (List detected problems)  
        - ✅ **Recommended Fix:** (Provide corrected version)  
        - 💡 **Improvements:** (Additional optimizations)  
        - 📝 **Final Note:** (Summary of findings)  

        2️⃣ *For Error-Free Code:*  
        - ✅ **Good Code:** (Show the correct code snippet)  
        - 💡 **Recommended Improvements:** (If applicable)  
        - 🛑 **Code Smells:** (If applicable)  
        - 📝 **Final Note:** (Summary of findings)  
    `,
});

/**
 * Detects if the input is code or casual text.
 */
function isCodeSnippet(text) {
    return /function\s+\w+|\bclass\b|\bconst\b|\blet\b|\bvar\b|\bimport\b|\bexport\b|\(\)\s*=>/.test(text);
}

/**
 * Splits large code into smaller chunks (5000 characters per chunk).
 */
function splitIntoChunks(str, size) {
    const chunks = [];
    for (let i = 0; i < str.length; i += size) {
        chunks.push(str.substring(i, i + size));
    }
    return chunks;
}

/**
 * Generates a structured code review using Gemini AI.
 */
async function generateCodeReview(code) {
    const codeChunks = splitIntoChunks(code, 5000);
    let fullReview = "";

    for (let i = 0; i < codeChunks.length; i++) {
        const prompt = `
            Analyze the following code and provide a structured review based on detected errors and improvements:
            
            \`\`\`
            ${codeChunks[i]}
            \`\`\`

            Respond strictly in this format:  
            📝 **Review Output Format:**  
            
            *Detected Language:*  
            <language name>  
            
            ❌ **Bad Code:** (Show incorrect code snippet)  
            🔍 **Issues:** (List detected problems)  
            ✅ **Recommended Fix:** (Provide corrected version)  
            💡 **Improvements:** (Additional optimizations)  
            📝 **Final Note:** (Summary of findings)  
        `;

        try {
            const result = await model.generateContent(prompt);
            fullReview += result.response.text() + "\n\n";
        } catch (error) {
            console.error("Error generating review for chunk", i + 1, error);
            return "An error occurred while reviewing the code.";
        }
    }

    console.log(fullReview);
    return fullReview;
}

/**
 * Determines whether to generate a casual response or a code review.
 */
async function generateContent(inputText) {
    if (!isCodeSnippet(inputText)) {
        // Handle casual text separately
        const casualPrompt = `Hey, let's chat! Here's something someone said: "${inputText}". Respond casually and naturally.`;
        try {
            const result = await model.generateContent(casualPrompt);
            return result.response.text();
        } catch (error) {
            console.error("Error generating casual response:", error);
            return "Oops! Something went wrong while processing your message.";
        }
    }

    // If it's code, proceed with structured code review
    return generateCodeReview(inputText);
}

module.exports = generateContent;
