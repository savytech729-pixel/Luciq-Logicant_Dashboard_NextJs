import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const AI_MODELS = {
  FLASH: "gemini-1.5-flash",
  PRO: "gemini-1.5-pro",
};

/**
 * Intelligent Resume Parser
 * Uses Gemini 1.5 Flash for high-speed document extraction
 */
export async function parseResume(fileName: string, content?: string, fileData?: { base64: string, mimeType: string }) {
  // MOCK DATA FOR TEST PURPOSES (BYPASSING ACTUAL PARSING)
  console.log(`[TEST MODE] Bypassing AI parsing for: ${fileName}`);
  
  // Return a generic mock candidate structure
  return {
    name: fileName.split('.')[0].replace(/_/g, ' ').replace(/-/g, ' '),
    email: `candidate_${Math.floor(Math.random() * 1000)}@example.com`,
    phone: "+91 9876543210",
    currentRole: "Software Engineer",
    totalExperience: "5",
    skills: ["React", "TypeScript", "Node.js", "Next.js"],
    education: "Bachelor of Technology",
    summary: "Experienced software developer with a focus on building scalable web applications.",
    preferredLocation: "Remote",
    noticePeriod: "Immediate",
    expectedSalary: "₹18,00,000"
  };
}


/**
 * Advanced Match Analysis
 * Compares a candidate profile against a job description
 */
export async function analyzeMatch(candidate: any, job: any) {
  const model = genAI.getGenerativeModel({ model: AI_MODELS.FLASH });

  const prompt = `
    Analyze the match between this Candidate and this Vacancy.
    
    Candidate:
    ${JSON.stringify(candidate)}
    
    Vacancy:
    ${JSON.stringify(job)}
    
    Return ONLY a JSON object:
    {
      "score": number (0-100),
      "reasoning": "Short 2 sentence explanation of the match",
      "breakdown": {
        "skills": number (0-100),
        "experience": number (0-100),
        "location": number (0-100),
        "salary": number (0-100)
      },
      "strengths": ["Strength 1", "Strength 2"],
      "gaps": ["Gap 1", "Gap 2"]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("AI Match Error:", err);
    return null;
  }
}

/**
 * Personalized Outreach Generator
 */
export async function generateOutreachMessage(candidate: any, job: any, channel: 'email' | 'whatsapp') {
  const model = genAI.getGenerativeModel({ model: AI_MODELS.FLASH });

  const prompt = `
    Generate a professional and highly engaging ${channel} invitation message from a recruiter to a candidate.
    
    Recruiter Name: Admin at Talent Platform
    Candidate Name: ${candidate.name}
    Job Title: ${job.title}
    
    Context: The AI matched this candidate with a high score because of their expertise in ${candidate.skills}.
    
    Return ONLY a JSON object:
    {
      "title": "Subject line (if email) or Header",
      "message": "The full message body",
      "actionUrl": "The link for them to apply/accept"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("AI Outreach Error:", err);
    return null;
  }
}

/**
 * AI Pre-screening Evaluator
 */
export async function evaluateScreening(answers: { question: string, answer: string }[], job: any) {
  const model = genAI.getGenerativeModel({ model: AI_MODELS.FLASH });

  const prompt = `
    Evaluate the following pre-screening interview for the position: ${job.title}.
    
    Interview History:
    ${answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')}
    
    Compare these answers against the job requirements and context.
    
    Return ONLY a JSON object:
    {
      "score": number (0-100),
      "summary": "1-sentence executive summary of the candidate's responses",
      "verdict": "RECOMMENDED" | "MAYBE" | "NOT_RECOMMENDED",
      "keyInsights": ["Insight 1", "Insight 2"],
      "aiUsageScore": number (0-100),
      "isAI": boolean
    }

    The 'aiUsageScore' represents the likelihood (0-100) that these answers were written by an AI like ChatGPT (unnatural structure, robotic phrasing, too perfect).
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    
    return {
      ...parsed,
      aiUsageScore: parsed.aiUsageScore || 0,
      isAI: parsed.isAI || (parsed.aiUsageScore > 75)
    };
  } catch (err) {
    console.error("AI Screening Evaluation Error:", err);
    return null;
  }
}

/**
 * AI Question Generator for Jobs
 */
export async function generateScreeningQuestions(job: any) {
  const model = genAI.getGenerativeModel({ model: AI_MODELS.FLASH });

  const prompt = `
    You are an expert technical recruiter. Generate 3 highly specific, practical interview questions for the job role: "${job.title}".
    
    JOB REQUIREMENTS & CONTEXT:
    ${job.description}
    
    KEY SKILLS REQUIRED: 
    ${Array.isArray(job.requiredSkills) ? job.requiredSkills.join(", ") : job.requiredSkills}
    
    OBJECTIVE:
    Create questions that specifically test the candidate's proficiency in the required skills and their understanding of the job role's unique challenges. Avoid generic questions. Focus on practical scenarios or technical depth related to the ${job.title} role.
    
    Return ONLY a JSON array of 3 strings:
    ["Specific Question 1", "Specific Question 2", "Specific Question 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("AI Question Generation Error:", err);
    return ["Tell us about your experience in a similar role.", "What is your biggest technical challenge so far?", "Why do you want to join our team?"];
  }
}


