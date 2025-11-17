// Sample Test Data for Project Collaboration Feature
// Run this in browser console when logged in to create sample projects

async function createSampleProjects() {
    if (!currentUser || !userProfile) {
        console.error('Please log in first!');
        return;
    }

    const sampleProjects = [
        {
            title: "AI-Powered Recipe Recommender",
            description: "Building a machine learning model that recommends recipes based on ingredients you have, dietary preferences, and past cooking history. Looking for collaborators with ML and backend experience.",
            requiredSkills: ["Python", "Machine Learning", "TensorFlow"],
            techStack: ["Python", "TensorFlow", "Flask", "MongoDB", "React"],
            projectType: "Machine Learning",
            githubLink: "https://github.com/sample/recipe-ai",
            driveLink: null
        },
        {
            title: "Open Source Task Manager",
            description: "Creating a modern, collaborative task management tool with real-time updates, team features, and integrations. Need frontend and backend developers to help build this open-source project.",
            requiredSkills: ["JavaScript", "React", "Node.js"],
            techStack: ["React", "Node.js", "Firebase", "MongoDB"],
            projectType: "Open Source",
            githubLink: "https://github.com/sample/task-manager",
            driveLink: null
        },
        {
            title: "Mobile Fitness Tracking App",
            description: "Building a cross-platform fitness app with workout tracking, nutrition logging, and social features. Looking for mobile developers and designers to create an amazing user experience.",
            requiredSkills: ["React Native", "JavaScript", "UI/UX"],
            techStack: ["React Native", "Firebase", "Node.js"],
            projectType: "Mobile App",
            githubLink: null,
            driveLink: "https://drive.google.com/sample"
        },
        {
            title: "E-Commerce Platform with AR Try-On",
            description: "Developing an innovative e-commerce platform that uses augmented reality for virtual try-ons. This is a full-stack project requiring expertise in AR, web development, and backend systems.",
            requiredSkills: ["JavaScript", "Python", "AR/VR"],
            techStack: ["React", "Three.js", "Python", "Django", "PostgreSQL"],
            projectType: "Web Development",
            githubLink: "https://github.com/sample/ar-ecommerce",
            driveLink: null
        },
        {
            title: "Climate Data Visualization Dashboard",
            description: "Research project to visualize global climate data with interactive charts and predictive models. Perfect for data scientists and visualization experts who care about environmental issues.",
            requiredSkills: ["Python", "Data Science", "JavaScript"],
            techStack: ["Python", "PyTorch", "React", "D3.js", "PostgreSQL"],
            projectType: "Research",
            githubLink: "https://github.com/sample/climate-viz",
            driveLink: "https://drive.google.com/sample-research"
        },
        {
            title: "Multiplayer Strategy Game",
            description: "Creating a browser-based multiplayer strategy game with real-time gameplay, AI opponents, and social features. Looking for game developers, backend engineers, and creative designers.",
            requiredSkills: ["JavaScript", "Game Development", "WebGL"],
            techStack: ["JavaScript", "Three.js", "WebSocket", "Node.js", "MongoDB"],
            projectType: "Game Development",
            githubLink: null,
            driveLink: null
        },
        {
            title: "Student Learning Platform",
            description: "Building an educational platform for students with interactive courses, quizzes, and progress tracking. Need developers passionate about education technology.",
            requiredSkills: ["JavaScript", "React", "Node.js"],
            techStack: ["React", "Node.js", "MongoDB", "Firebase"],
            projectType: "Web Development",
            githubLink: "https://github.com/sample/edu-platform",
            driveLink: null
        },
        {
            title: "IoT Home Automation System",
            description: "Developing a comprehensive home automation system with mobile and web interfaces. Requires knowledge of IoT protocols, embedded systems, and app development.",
            requiredSkills: ["Python", "JavaScript", "IoT"],
            techStack: ["Python", "React", "React Native", "MQTT", "Raspberry Pi"],
            projectType: "Other",
            githubLink: "https://github.com/sample/iot-home",
            driveLink: null
        }
    ];

    console.log('Creating sample projects...');
    
    for (let i = 0; i < sampleProjects.length; i++) {
        try {
            const project = sampleProjects[i];
            const projectData = {
                ...project,
                ownerId: currentUser.uid,
                ownerName: userProfile.name,
                ownerImage: userProfile.profileImage || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'open',
                collaboratorsCount: 0
            };

            await db.collection('projects').add(projectData);
            console.log(`✅ Created: ${project.title}`);
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            console.error(`❌ Error creating project ${i + 1}:`, error);
        }
    }
    
    console.log('✨ Sample projects created successfully!');
    console.log('Navigate to Projects page to see them.');
}

// Instructions
console.log(`
==============================================
📦 SAMPLE PROJECT CREATOR
==============================================

To create sample projects, run:
    createSampleProjects()

This will create 8 diverse sample projects:
  - AI/ML projects
  - Web development
  - Mobile apps
  - Game development
  - Research projects
  - IoT projects

Note: You must be logged in with a profile.
==============================================
`);

// Export function to window
window.createSampleProjects = createSampleProjects;
