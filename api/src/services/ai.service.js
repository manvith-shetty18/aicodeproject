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

        *Review Guidelines:*  
        - If code is too lengthy, analyze it **in logical sections** and mention if it was **partially reviewed**.
        - Provide a friendly, constructive tone while maintaining precision.
    `,
});

/**
 * Detects common code smells in JavaScript/JSX code.
 */
function detectCodeSmells(code) {
    const smells = [];

    // Check for long functions (over 30 lines)
    const functionMatches = code.match(/function\s+\w+\s*\(.*\)\s*{([\s\S]*?)}/g);
    if (functionMatches) {
        functionMatches.forEach((fn) => {
            const lines = fn.split("\n").length;
            if (lines > 30) {
                smells.push(`⚠️ **Long Function Detected:** A function exceeds 30 lines. Consider breaking it into smaller functions.`);
            }
        });
    }

    // Check for large classes (over 200 lines)
    const classMatches = code.match(/class\s+\w+\s*{([\s\S]*?)}/g);
    if (classMatches) {
        classMatches.forEach((cls) => {
            const lines = cls.split("\n").length;
            if (lines > 200) {
                smells.push(`⚠️ **Large Class Detected:** A class exceeds 200 lines. Consider splitting it into multiple classes.`);
            }
        });
    }

    // Check for too many parameters (more than 5)
    const paramMatches = code.match(/function\s+\w+\s*\((.*?)\)/g);
    if (paramMatches) {
        paramMatches.forEach((fn) => {
            const params = fn.match(/\((.*?)\)/)[1].split(",");
            if (params.length > 5) {
                smells.push(`⚠️ **Too Many Parameters:** A function has more than 5 parameters. Consider grouping them into an object.`);
            }
        });
    }

    return smells;
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
async function generateContent(code) {
    const codeSmells = detectCodeSmells(code); // Run code smell detection
    const codeChunks = splitIntoChunks(code, 5000); // Splitting large code into chunks
    let fullReview = "";

    // Include detected code smells in the review
    if (codeSmells.length > 0) {
        fullReview += `🛑 **Code Smells Detected:**\n${codeSmells.join("\n")}\n\n`;
    }

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

module.exports = generateContent;
