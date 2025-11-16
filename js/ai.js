// Google AI integration for smart features

// Generate AI-powered bio suggestions
async function generateBioSuggestion(skills, interests) {
    if (!GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY === 'YOUR_GOOGLE_AI_API_KEY') {
        return null;
    }

    try {
        const prompt = `Generate a short, professional bio (max 100 words) for a developer with these skills: ${skills.join(', ')} and interested in: ${interests.join(', ')}. Make it engaging and authentic.`;

        const response = await fetch(GOOGLE_AI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        const data = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text || null;
    } catch (error) {
        console.error('AI generation error:', error);
        return null;
    }
}

// Generate conversation starters
async function generateConversationStarter(matchedUser) {
    if (!GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY === 'YOUR_GOOGLE_AI_API_KEY') {
        return getDefaultStarter(matchedUser);
    }

    try {
        const sharedSkills = (userProfile.skills || []).filter(skill =>
            (matchedUser.skills || []).includes(skill)
        ).join(', ');

        const prompt = `Generate a friendly, casual ice-breaker message for a developer networking platform. The matched developers share these skills: ${sharedSkills}. Keep it under 30 words, professional but friendly.`;

        const response = await fetch(GOOGLE_AI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        const data = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text || getDefaultStarter(matchedUser);
    } catch (error) {
        console.error('AI generation error:', error);
        return getDefaultStarter(matchedUser);
    }
}

function getDefaultStarter(matchedUser) {
    const starters = [
        `Hey ${matchedUser.name}! I'd love to connect and discuss projects!`,
        `Hi! I noticed we share similar interests. Would love to chat!`,
        `Hello! Great profile! Let's connect and see how we can collaborate.`,
        `Hey there! Excited to connect with another developer!`
    ];
    return starters[Math.floor(Math.random() * starters.length)];
}

// Analyze compatibility and generate insights
async function generateMatchInsights(matchedUser) {
    if (!GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY === 'YOUR_GOOGLE_AI_API_KEY') {
        return null;
    }

    try {
        const prompt = `Compare two developer profiles and suggest 2-3 potential collaboration ideas:
Profile 1: Skills: ${userProfile.skills?.join(', ')}, Interests: ${userProfile.projectInterests?.join(', ')}
Profile 2: Skills: ${matchedUser.skills?.join(', ')}, Interests: ${matchedUser.projectInterests?.join(', ')}
Keep it brief and actionable.`;

        const response = await fetch(GOOGLE_AI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        const data = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text || null;
    } catch (error) {
        console.error('AI generation error:', error);
        return null;
    }
}

// Suggest skills based on current skills
async function suggestSkills(currentSkills) {
    if (!GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY === 'YOUR_GOOGLE_AI_API_KEY') {
        return [];
    }

    try {
        const prompt = `Given a developer has these skills: ${currentSkills.join(', ')}, suggest 5 complementary skills they should learn next. Return only skill names, comma-separated.`;

        const response = await fetch(GOOGLE_AI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        const data = await response.json();
        const text = data.candidates[0]?.content?.parts[0]?.text || '';
        return text.split(',').map(s => s.trim()).filter(s => s);
    } catch (error) {
        console.error('AI generation error:', error);
        return [];
    }
}
