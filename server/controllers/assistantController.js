const MAX_CONTEXT_ITEMS = 20;

function compactStudentContext(student = {}, applications = [], drives = []) {
  return {
    profile: {
      name: student.name || student.fullName || '',
      branch: student.branch || '',
      cgpa: student.cgpa ?? null,
      tenth: student.tenth ?? student.tenthPercentage ?? null,
      twelfth: student.twelfth ?? student.twelfthPercentage ?? null,
      backlogs: student.backlogs ?? null,
      skills: student.skills || '',
    },
    applications: applications.slice(0, MAX_CONTEXT_ITEMS).map((application) => ({
      company: application.company || application.companyName || '',
      role: application.role || '',
      status: application.stage || application.status || '',
      package: application.package || '',
    })),
    drives: drives.slice(0, MAX_CONTEXT_ITEMS).map((drive) => ({
      company: drive.company || drive.name || '',
      role: drive.role || '',
      status: drive.status || '',
      deadline: drive.deadline || '',
      minCgpa: drive.minCgpa ?? null,
      branches: drive.branches || [],
      maxBacklogs: drive.maxBacklogs ?? null,
    })),
  };
}

exports.chat = async (req, res) => {
  try {
    const { question, student, applications = [], drives = [] } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ success: false, message: 'Gemini API key is not configured on the server.' });
    }

    if (!String(question || '').trim()) {
      return res.status(400).json({ success: false, message: 'A question is required.' });
    }

    const context = compactStudentContext(student, applications, drives);
    const prompt = [
      'You are CampusBridge Placement Assistant.',
      'Answer the student question using only the placement context below.',
      'Be concise, practical, and do not invent companies, deadlines, application statuses, or eligibility results.',
      'If the context does not contain enough information, say what the student should check in the portal.',
      '',
      `Student question: ${String(question).trim()}`,
      '',
      `Placement context: ${JSON.stringify(context)}`,
    ].join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({ success: false, message: data.error?.message || 'Gemini could not answer the question.' });
    }

    const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!answer) {
      return res.status(502).json({ success: false, message: 'Gemini returned an empty answer.' });
    }

    return res.json({ success: true, answer });
  } catch (error) {
    console.error('Placement assistant error:', error.message);
    return res.status(502).json({ success: false, message: 'The AI assistant is temporarily unavailable.' });
  }
};
