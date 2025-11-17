// Project Collaboration Feature for DevDate

let activeProjectId = null;
let projectsListener = null;
let requestsListener = null;
let myRequestsListener = null;
let currentMyRequestsFilter = 'all';

// Project Types
const PROJECT_TYPES = [
    'Web Development',
    'Mobile App',
    'Desktop App',
    'Machine Learning',
    'Data Science',
    'Game Development',
    'Open Source',
    'Research',
    'Other'
];

// Tech Stacks
const TECH_STACKS = [
    'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Django', 'Flask',
    'Java', 'Spring Boot', 'C++', 'C#', '.NET', 'Ruby on Rails',
    'PHP', 'Laravel', 'Go', 'Rust', 'Flutter', 'React Native',
    'Swift', 'Kotlin', 'TensorFlow', 'PyTorch', 'MongoDB', 'PostgreSQL',
    'MySQL', 'Firebase', 'AWS', 'Azure', 'Docker', 'Kubernetes'
];

// ============ CREATE PROJECT ============
async function createProject() {
    const title = document.getElementById('project-title').value.trim();
    const description = document.getElementById('project-description').value.trim();
    const projectType = document.getElementById('project-type').value;
    const githubLink = document.getElementById('github-link').value.trim();
    const driveLink = document.getElementById('drive-link').value.trim();

    // Get selected skills
    const skillCheckboxes = document.querySelectorAll('input[name="project-skills"]:checked');
    const requiredSkills = Array.from(skillCheckboxes).map(cb => cb.value);

    // Get selected tech stack
    const techCheckboxes = document.querySelectorAll('input[name="tech-stack"]:checked');
    const techStack = Array.from(techCheckboxes).map(cb => cb.value);

    // Validation
    if (!title) {
        alert('Please enter a project title');
        return;
    }

    if (!description) {
        alert('Please enter a project description');
        return;
    }

    if (!projectType) {
        alert('Please select a project type');
        return;
    }

    if (requiredSkills.length === 0) {
        alert('Please select at least one required skill');
        return;
    }

    if (techStack.length === 0) {
        alert('Please select at least one technology');
        return;
    }

    showLoading();

    try {
        const projectData = {
            title,
            description,
            requiredSkills,
            techStack,
            projectType,
            githubLink: githubLink || null,
            driveLink: driveLink || null,
            ownerId: currentUser.uid,
            ownerName: userProfile.name,
            ownerImage: userProfile.profileImage || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'open',
            collaboratorsCount: 0
        };

        await db.collection('projects').add(projectData);

        alert('Project created successfully!');
        
        // Reset form
        document.getElementById('create-project-form').reset();
        
        // Clear checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        // Refresh projects feed
        showPage('projects');

    } catch (error) {
        console.error('Error creating project:', error);
        alert('Error creating project: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ============ LOAD PROJECTS FEED ============
async function loadProjectsFeed(filters = {}) {
    const feedContainer = document.getElementById('projects-feed');
    feedContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        // Clean up existing listener
        if (projectsListener) {
            projectsListener();
        }

        // Build query
        let query = db.collection('projects')
            .where('status', '==', 'open')
            .orderBy('createdAt', 'desc');

        // Apply filters
        if (filters.projectType && filters.projectType !== 'all') {
            query = query.where('projectType', '==', filters.projectType);
        }

        // Set up real-time listener
        projectsListener = query.onSnapshot(snapshot => {
            let projects = [];
            
            snapshot.forEach(doc => {
                const project = { id: doc.id, ...doc.data() };
                
                // Client-side filtering for skills and tech stack
                let includeProject = true;

                if (filters.skills && filters.skills.length > 0) {
                    const hasSkill = filters.skills.some(skill => 
                        project.requiredSkills.includes(skill)
                    );
                    if (!hasSkill) includeProject = false;
                }

                if (filters.techStack && filters.techStack.length > 0) {
                    const hasTech = filters.techStack.some(tech => 
                        project.techStack.includes(tech)
                    );
                    if (!hasTech) includeProject = false;
                }

                if (includeProject) {
                    projects.push(project);
                }
            });

            renderProjectsFeed(projects);
        }, error => {
            console.error('Error loading projects:', error);
            feedContainer.innerHTML = '<p class="error">Error loading projects</p>';
        });

    } catch (error) {
        console.error('Error setting up projects feed:', error);
        feedContainer.innerHTML = '<p class="error">Error loading projects</p>';
    }
}

// ============ RENDER PROJECTS FEED ============
function renderProjectsFeed(projects) {
    const feedContainer = document.getElementById('projects-feed');
    
    if (projects.length === 0) {
        feedContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-project-diagram" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 20px;"></i>
                <h2>No Projects Found</h2>
                <p>Be the first to create a project or adjust your filters</p>
                <button onclick="showPage('create-project')" class="btn btn-primary">Create Project</button>
            </div>
        `;
        return;
    }

    feedContainer.innerHTML = '';

    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        
        const isOwner = project.ownerId === currentUser.uid;
        
        projectCard.innerHTML = `
            <div class="project-header">
                <div class="project-owner">
                    ${project.ownerImage 
                        ? `<img src="${project.ownerImage}" alt="${project.ownerName}">` 
                        : `<div class="avatar-placeholder">${project.ownerName.charAt(0)}</div>`
                    }
                    <div>
                        <h4>${project.ownerName}</h4>
                        <span class="project-type-badge">${project.projectType}</span>
                    </div>
                </div>
                ${isOwner ? '<span class="owner-badge">Your Project</span>' : ''}
            </div>
            
            <h3 class="project-title">${escapeHtml(project.title)}</h3>
            <p class="project-description">${escapeHtml(project.description).substring(0, 150)}${project.description.length > 150 ? '...' : ''}</p>
            
            <div class="project-meta">
                <div class="meta-section">
                    <strong>Required Skills:</strong>
                    <div class="tags-container">
                        ${project.requiredSkills.map(skill => `<span class="tag skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                
                <div class="meta-section">
                    <strong>Tech Stack:</strong>
                    <div class="tags-container">
                        ${project.techStack.slice(0, 5).map(tech => `<span class="tag tech-tag">${tech}</span>`).join('')}
                        ${project.techStack.length > 5 ? `<span class="tag">+${project.techStack.length - 5} more</span>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="project-actions">
                <button onclick="viewProjectDetails('${project.id}')" class="btn btn-secondary">
                    <i class="fas fa-info-circle"></i> View Details
                </button>
                ${!isOwner ? `
                    <button onclick="openCollaborationRequest('${project.id}')" class="btn btn-primary">
                        <i class="fas fa-handshake"></i> Request to Collaborate
                    </button>
                ` : `
                    <button onclick="viewProjectRequests('${project.id}')" class="btn btn-primary">
                        <i class="fas fa-inbox"></i> View Requests
                    </button>
                `}
            </div>
        `;
        
        feedContainer.appendChild(projectCard);
    });

    // Animate cards
    if (window.DevDateAnimations && window.DevDateAnimations.animateElements) {
        window.DevDateAnimations.animateElements('.project-card');
    }
}

// ============ VIEW PROJECT DETAILS ============
async function viewProjectDetails(projectId) {
    showPage('project-details');
    activeProjectId = projectId;
    
    const container = document.getElementById('project-details-container');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const doc = await db.collection('projects').doc(projectId).get();
        
        if (!doc.exists) {
            container.innerHTML = '<p class="error">Project not found</p>';
            return;
        }

        const project = { id: doc.id, ...doc.data() };
        const isOwner = project.ownerId === currentUser.uid;

        container.innerHTML = `
            <div class="project-details-card">
                <button onclick="showPage('projects')" class="back-btn">
                    <i class="fas fa-arrow-left"></i> Back to Projects
                </button>
                
                <div class="project-header-large">
                    <div class="project-owner-info">
                        ${project.ownerImage 
                            ? `<img src="${project.ownerImage}" alt="${project.ownerName}" class="owner-avatar-large">` 
                            : `<div class="avatar-placeholder-large">${project.ownerName.charAt(0)}</div>`
                        }
                        <div>
                            <h3>${project.ownerName}</h3>
                            <p>Project Owner</p>
                        </div>
                    </div>
                    ${isOwner ? '<span class="owner-badge">Your Project</span>' : ''}
                </div>

                <h1 class="project-title-large">${escapeHtml(project.title)}</h1>
                <span class="project-type-badge-large">${project.projectType}</span>

                <div class="project-section">
                    <h3><i class="fas fa-align-left"></i> Description</h3>
                    <p class="project-description-full">${escapeHtml(project.description)}</p>
                </div>

                <div class="project-section">
                    <h3><i class="fas fa-tools"></i> Required Skills</h3>
                    <div class="tags-container">
                        ${project.requiredSkills.map(skill => `<span class="tag skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>

                <div class="project-section">
                    <h3><i class="fas fa-code"></i> Tech Stack</h3>
                    <div class="tags-container">
                        ${project.techStack.map(tech => `<span class="tag tech-tag">${tech}</span>`).join('')}
                    </div>
                </div>

                ${project.githubLink || project.driveLink ? `
                    <div class="project-section">
                        <h3><i class="fas fa-link"></i> Resources</h3>
                        <div class="project-links">
                            ${project.githubLink ? `
                                <a href="${project.githubLink}" target="_blank" class="project-link">
                                    <i class="fab fa-github"></i> GitHub Repository
                                </a>
                            ` : ''}
                            ${project.driveLink ? `
                                <a href="${project.driveLink}" target="_blank" class="project-link">
                                    <i class="fab fa-google-drive"></i> Drive Link
                                </a>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${!isOwner ? `
                    <div class="collaboration-request-section">
                        <h3><i class="fas fa-handshake"></i> Request to Collaborate</h3>
                        <form onsubmit="submitCollaborationRequest(event, '${project.id}')" class="collaboration-form">
                            <textarea 
                                id="collaboration-message" 
                                placeholder="Tell the project owner why you'd like to collaborate and what you can bring to the project..."
                                rows="4"
                                required
                            ></textarea>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-paper-plane"></i> Send Request
                            </button>
                        </form>
                    </div>
                ` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Error loading project details:', error);
        container.innerHTML = '<p class="error">Error loading project details</p>';
    }
}

// ============ SUBMIT COLLABORATION REQUEST ============
async function submitCollaborationRequest(event, projectId) {
    event.preventDefault();
    
    const message = document.getElementById('collaboration-message').value.trim();
    
    if (!message) {
        alert('Please enter a message');
        return;
    }

    showLoading();

    try {
        // Check if request already exists
        const existingRequest = await db.collection('projects')
            .doc(projectId)
            .collection('requests')
            .where('requesterId', '==', currentUser.uid)
            .get();

        if (!existingRequest.empty) {
            alert('You have already sent a collaboration request for this project');
            hideLoading();
            return;
        }

        // Create request
        const requestData = {
            requesterId: currentUser.uid,
            requesterName: userProfile.name,
            requesterImage: userProfile.profileImage || null,
            requesterSkills: userProfile.skills || [],
            message,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('projects')
            .doc(projectId)
            .collection('requests')
            .add(requestData);

        alert('Collaboration request sent successfully!');
        document.getElementById('collaboration-message').value = '';
        showPage('projects');

    } catch (error) {
        console.error('Error sending collaboration request:', error);
        alert('Error sending request: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Quick open from feed
function openCollaborationRequest(projectId) {
    viewProjectDetails(projectId);
}

// ============ VIEW PROJECT REQUESTS ============
async function viewProjectRequests(projectId) {
    showPage('project-requests');
    activeProjectId = projectId;
    
    const container = document.getElementById('project-requests-container');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        // Load project info
        const projectDoc = await db.collection('projects').doc(projectId).get();
        
        if (!projectDoc.exists) {
            container.innerHTML = '<p class="error">Project not found</p>';
            return;
        }

        const project = projectDoc.data();

        // Set up real-time listener for requests
        if (requestsListener) {
            requestsListener();
        }

        requestsListener = db.collection('projects')
            .doc(projectId)
            .collection('requests')
            .orderBy('timestamp', 'desc')
            .onSnapshot(snapshot => {
                const requests = [];
                snapshot.forEach(doc => {
                    requests.push({ id: doc.id, ...doc.data() });
                });

                renderProjectRequests(project, requests);
            }, error => {
                console.error('Error loading requests:', error);
                container.innerHTML = '<p class="error">Error loading requests</p>';
            });

    } catch (error) {
        console.error('Error loading project requests:', error);
        container.innerHTML = '<p class="error">Error loading requests</p>';
    }
}

// ============ RENDER PROJECT REQUESTS ============
function renderProjectRequests(project, requests) {
    const container = document.getElementById('project-requests-container');
    
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const acceptedRequests = requests.filter(r => r.status === 'accepted');
    const rejectedRequests = requests.filter(r => r.status === 'rejected');

    container.innerHTML = `
        <div class="requests-page">
            <button onclick="showPage('projects')" class="back-btn">
                <i class="fas fa-arrow-left"></i> Back to Projects
            </button>

            <h1><i class="fas fa-inbox"></i> Collaboration Requests</h1>
            <h2 class="project-title-small">${escapeHtml(project.title)}</h2>

            <div class="requests-tabs">
                <button class="tab-btn active" onclick="switchRequestTab('pending')">
                    Pending (${pendingRequests.length})
                </button>
                <button class="tab-btn" onclick="switchRequestTab('accepted')">
                    Accepted (${acceptedRequests.length})
                </button>
                <button class="tab-btn" onclick="switchRequestTab('rejected')">
                    Rejected (${rejectedRequests.length})
                </button>
            </div>

            <div id="pending-requests" class="requests-section active">
                ${renderRequestsList(pendingRequests, 'pending')}
            </div>

            <div id="accepted-requests" class="requests-section">
                ${renderRequestsList(acceptedRequests, 'accepted')}
            </div>

            <div id="rejected-requests" class="requests-section">
                ${renderRequestsList(rejectedRequests, 'rejected')}
            </div>
        </div>
    `;
}

function renderRequestsList(requests, status) {
    if (requests.length === 0) {
        return `
            <div class="empty-state">
                <i class="fas fa-inbox" style="font-size: 3rem; color: var(--text-secondary);"></i>
                <p>No ${status} requests</p>
            </div>
        `;
    }

    return requests.map(request => `
        <div class="request-card ${status}">
            <div class="request-header">
                <div class="requester-info">
                    ${request.requesterImage 
                        ? `<img src="${request.requesterImage}" alt="${request.requesterName}">` 
                        : `<div class="avatar-placeholder">${request.requesterName.charAt(0)}</div>`
                    }
                    <div>
                        <h4>${request.requesterName}</h4>
                        <p class="request-time">${formatTimestamp(request.timestamp)}</p>
                    </div>
                </div>
                <span class="status-badge ${status}">${status.toUpperCase()}</span>
            </div>

            ${request.requesterSkills && request.requesterSkills.length > 0 ? `
                <div class="requester-skills">
                    <strong>Skills:</strong>
                    <div class="tags-container">
                        ${request.requesterSkills.slice(0, 5).map(skill => `<span class="tag skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            <p class="request-message">${escapeHtml(request.message)}</p>

            ${status === 'pending' ? `
                <div class="request-actions">
                    <button onclick="handleRequest('${activeProjectId}', '${request.id}', 'accepted')" class="btn btn-success">
                        <i class="fas fa-check"></i> Accept
                    </button>
                    <button onclick="handleRequest('${activeProjectId}', '${request.id}', 'rejected')" class="btn btn-danger">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Switch between request tabs
function switchRequestTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.requests-section').forEach(section => section.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tab}-requests`).classList.add('active');
}

// ============ HANDLE REQUEST (ACCEPT/REJECT) ============
async function handleRequest(projectId, requestId, newStatus) {
    showLoading();

    try {
        const requestRef = db.collection('projects')
            .doc(projectId)
            .collection('requests')
            .doc(requestId);

        // Get request data
        const requestDoc = await requestRef.get();
        if (!requestDoc.exists) {
            alert('Request not found');
            hideLoading();
            return;
        }

        const requestData = requestDoc.data();

        // Update request status
        await requestRef.update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // If accepted, create collaboration document
        if (newStatus === 'accepted') {
            await db.collection('collaborations').add({
                projectId,
                ownerId: currentUser.uid,
                collaboratorId: requestData.requesterId,
                collaboratorName: requestData.requesterName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update project collaborators count
            const projectRef = db.collection('projects').doc(projectId);
            await projectRef.update({
                collaboratorsCount: firebase.firestore.FieldValue.increment(1)
            });
        }

        alert(`Request ${newStatus} successfully!`);

    } catch (error) {
        console.error('Error handling request:', error);
        alert('Error updating request: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ============ APPLY FILTERS ============
function applyProjectFilters() {
    const projectType = document.getElementById('filter-project-type').value;
    
    const skillCheckboxes = document.querySelectorAll('input[name="filter-skills"]:checked');
    const skills = Array.from(skillCheckboxes).map(cb => cb.value);
    
    const techCheckboxes = document.querySelectorAll('input[name="filter-tech"]:checked');
    const techStack = Array.from(techCheckboxes).map(cb => cb.value);

    const filters = {
        projectType: projectType !== 'all' ? projectType : null,
        skills: skills.length > 0 ? skills : null,
        techStack: techStack.length > 0 ? techStack : null
    };

    loadProjectsFeed(filters);
}

function clearProjectFilters() {
    document.getElementById('filter-project-type').value = 'all';
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    loadProjectsFeed();
}

// ============ UTILITY FUNCTIONS ============
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize projects page
function initializeProjectsPage() {
    // Populate project type dropdown
    const projectTypeSelect = document.getElementById('project-type');
    if (projectTypeSelect) {
        PROJECT_TYPES.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            projectTypeSelect.appendChild(option);
        });
    }

    // Populate filter project type
    const filterProjectTypeSelect = document.getElementById('filter-project-type');
    if (filterProjectTypeSelect) {
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Types';
        filterProjectTypeSelect.appendChild(allOption);
        
        PROJECT_TYPES.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            filterProjectTypeSelect.appendChild(option);
        });
    }
}

// Load user's skills for checkboxes
function loadUserSkillsForProjects() {
    const skillsContainer = document.getElementById('project-skills-list');
    if (skillsContainer && userProfile && userProfile.skills) {
        userProfile.skills.forEach(skill => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            label.innerHTML = `
                <input type="checkbox" name="project-skills" value="${skill}">
                <span>${skill}</span>
            `;
            skillsContainer.appendChild(label);
        });
    }
}

// Load tech stack checkboxes
function loadTechStackOptions() {
    const techContainer = document.getElementById('tech-stack-list');
    if (techContainer) {
        TECH_STACKS.forEach(tech => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            label.innerHTML = `
                <input type="checkbox" name="tech-stack" value="${tech}">
                <span>${tech}</span>
            `;
            techContainer.appendChild(label);
        });
    }
}

// ============ MY REQUESTS SENT ============
async function loadMyRequests() {
    const listContainer = document.getElementById('my-requests-list');
    listContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        // Clean up existing listener
        if (myRequestsListener) {
            myRequestsListener();
        }

        // Get all projects first
        const projectsSnapshot = await db.collection('projects').get();
        const requestsData = [];

        // For each project, query its requests subcollection
        const promises = projectsSnapshot.docs.map(async projectDoc => {
            const projectId = projectDoc.id;
            const projectData = projectDoc.data();
            
            const requestsSnapshot = await db.collection('projects')
                .doc(projectId)
                .collection('requests')
                .where('requesterId', '==', currentUser.uid)
                .get();
            
            requestsSnapshot.docs.forEach(reqDoc => {
                const request = { id: reqDoc.id, ...reqDoc.data() };
                request.project = { id: projectId, ...projectData };
                requestsData.push(request);
            });
        });

        await Promise.all(promises);

        // Sort by creation date
        requestsData.sort((a, b) => {
            const aTime = a.createdAt?.toMillis() || 0;
            const bTime = b.createdAt?.toMillis() || 0;
            return bTime - aTime;
        });

        renderMyRequests(requestsData);

        // Set up real-time listener for updates
        myRequestsListener = db.collectionGroup('requests')
            .where('requesterId', '==', currentUser.uid)
            .onSnapshot(snapshot => {
                // Reload when changes detected
                loadMyRequests();
            }, error => {
                console.error('Error in requests listener:', error);
            });

    } catch (error) {
        console.error('Error setting up my requests:', error);
        listContainer.innerHTML = '<p class="error">Error loading requests</p>';
    }
}

function renderMyRequests(requests) {
    const listContainer = document.getElementById('my-requests-list');
    
    // Filter based on current filter
    let filteredRequests = requests;
    if (currentMyRequestsFilter !== 'all') {
        filteredRequests = requests.filter(r => r.status === currentMyRequestsFilter);
    }

    // Update counts
    document.getElementById('my-requests-all-count').textContent = requests.length;
    document.getElementById('my-requests-pending-count').textContent = requests.filter(r => r.status === 'pending').length;
    document.getElementById('my-requests-accepted-count').textContent = requests.filter(r => r.status === 'accepted').length;
    document.getElementById('my-requests-rejected-count').textContent = requests.filter(r => r.status === 'rejected').length;

    if (filteredRequests.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 20px;"></i>
                <h2>No ${currentMyRequestsFilter === 'all' ? '' : currentMyRequestsFilter} requests</h2>
                <p>You haven't sent any collaboration requests yet</p>
                <button onclick="showPage('projects')" class="btn btn-primary">Browse Projects</button>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = '';

    filteredRequests.forEach(request => {
        const requestCard = document.createElement('div');
        requestCard.className = `my-request-card status-${request.status}`;
        
        const statusIcon = {
            'pending': '<i class="fas fa-clock"></i>',
            'accepted': '<i class="fas fa-check-circle"></i>',
            'rejected': '<i class="fas fa-times-circle"></i>'
        }[request.status];

        const statusText = {
            'pending': 'Pending',
            'accepted': 'Accepted',
            'rejected': 'Rejected'
        }[request.status];

        requestCard.innerHTML = `
            <div class="request-status-badge ${request.status}">
                ${statusIcon} ${statusText}
            </div>
            
            <div class="request-project-info">
                <h3>${escapeHtml(request.project.title)}</h3>
                <p class="project-owner">
                    <i class="fas fa-user"></i> ${escapeHtml(request.project.ownerName)}
                </p>
                <div class="project-meta">
                    <span><i class="fas fa-folder"></i> ${escapeHtml(request.project.projectType)}</span>
                    <span><i class="fas fa-clock"></i> Sent ${formatTimestamp(request.createdAt)}</span>
                </div>
            </div>

            <div class="request-message">
                <strong>Your message:</strong>
                <p>${escapeHtml(request.message)}</p>
            </div>

            ${request.status === 'accepted' ? `
                <div class="accepted-notification">
                    <i class="fas fa-party-horn"></i>
                    <strong>Congratulations!</strong> Your request has been accepted. 
                    You are now a collaborator on this project!
                </div>
            ` : ''}

            ${request.status === 'rejected' ? `
                <div class="rejected-notification">
                    <i class="fas fa-info-circle"></i>
                    Your request was not accepted. Don't worry, keep looking for other projects!
                </div>
            ` : ''}

            <div class="request-actions">
                <button onclick="viewProjectDetails('${request.project.id}')" class="btn btn-secondary">
                    <i class="fas fa-eye"></i> View Project
                </button>
            </div>
        `;

        listContainer.appendChild(requestCard);
    });
}

function filterMyRequests(filter) {
    currentMyRequestsFilter = filter;
    
    // Update active tab
    document.querySelectorAll('.requests-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.tab-btn').classList.add('active');
    
    // Re-render with current data (listener will maintain the data)
    // Trigger a re-render by calling loadMyRequests which will use the filter
    const listContainer = document.getElementById('my-requests-list');
    if (listContainer.children.length > 0) {
        // Data already loaded, just filter display
        loadMyRequests();
    }
}
