// Profile management
console.log('🔵 profile.js loading...');

// IMPORTANT: Define critical display functions FIRST and make them globally accessible immediately
window.renderProfileCard = function(user, container, showActions = false) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    
    const age = user.age ? `, ${user.age}` : '';
    const location = [user.city, user.state].filter(Boolean).join(', ') || 'Location not specified';
    
    card.innerHTML = `
        <div class="profile-image">
            ${user.profileImage 
                ? `<img src="${user.profileImage}" alt="${user.name}">` 
                : `<div class="profile-placeholder">${user.name?.charAt(0) || '?'}</div>`
            }
        </div>
        <div class="profile-content">
            <div class="profile-header">
                <h2>${user.name || 'Anonymous'}${age}</h2>
                <p class="profile-location"><i class="fas fa-map-marker-alt"></i> ${location}</p>
            </div>
            <p class="profile-profession">${user.profession || 'Developer'}</p>
            <p class="bio">${user.bio || 'No bio yet'}</p>
            
            ${user.skills?.length ? `
                <div class="profile-section">
                    <h3><i class="fas fa-code"></i> Skills</h3>
                    <div class="tags">
                        ${user.skills.map(s => `<span class="tag skill-tag">${s}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${user.hobbies?.length ? `
                <div class="profile-section">
                    <h3><i class="fas fa-heart"></i> Hobbies</h3>
                    <div class="tags">
                        ${user.hobbies.map(h => `<span class="tag hobby-tag">${h}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${user.lookingFor?.length ? `
                <div class="profile-section">
                    <h3><i class="fas fa-bullseye"></i> Looking For</h3>
                    <div class="tags">
                        ${user.lookingFor.map(g => `<span class="tag goal-tag">${g.replace('-', ' ')}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="profile-links">
                ${user.githubUrl ? `<a href="${user.githubUrl}" target="_blank"><i class="fab fa-github"></i> GitHub</a>` : ''}
                ${user.linkedinUrl ? `<a href="${user.linkedinUrl}" target="_blank"><i class="fab fa-linkedin"></i> LinkedIn</a>` : ''}
            </div>
        </div>
        ${showActions ? `
            <div class="card-actions">
                <button class="btn-action btn-pass" onclick="swipe('left', '${user.id}')">
                    <i class="fas fa-times"></i>
                </button>
                <button class="btn-action btn-like" onclick="swipe('right', '${user.id}')">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        ` : ''}
    `;
    
    container.appendChild(card);
};
console.log('✅ renderProfileCard defined:', typeof window.renderProfileCard);

window.showEditProfile = function() {
    localStorage.setItem('editMode', 'true');
    window.location.href = 'profile-setup.html';
};
console.log('✅ showEditProfile defined:', typeof window.showEditProfile);

let profileData = {
    skills: [],
    hobbies: [],
    lookingFor: []
};

let selectedImageFile = null;

// Image upload preview
window.previewImage = function(event) {
    const file = event.target.files[0];
    if (file) {
        selectedImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('image-preview').innerHTML = 
                `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 10px; margin-top: 10px;">`;
        };
        reader.readAsDataURL(file);
    }
}

// Add/Remove tags
window.addSkill = function() {
    const input = document.getElementById('skill-input');
    const value = input.value.trim();
    if (value && !profileData.skills.includes(value)) {
        profileData.skills.push(value);
        renderTags('skills-container', profileData.skills, 'removeSkill');
        input.value = '';
    }
}

window.removeSkill = function(skill) {
    profileData.skills = profileData.skills.filter(s => s !== skill);
    renderTags('skills-container', profileData.skills, 'removeSkill');
}

window.addHobby = function() {
    const input = document.getElementById('hobby-input');
    const value = input.value.trim();
    if (value && !profileData.hobbies.includes(value)) {
        profileData.hobbies.push(value);
        renderTags('hobbies-container', profileData.hobbies, 'removeHobby');
        input.value = '';
    }
}

window.removeHobby = function(hobby) {
    profileData.hobbies = profileData.hobbies.filter(h => h !== hobby);
    renderTags('hobbies-container', profileData.hobbies, 'removeHobby');
}

function renderTags(containerId, tags, removeFunction) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = tags.map(tag => `
        <span class="tag">
            ${tag}
            <button onclick="${removeFunction}('${tag.replace(/'/g, "\\'")}')" class="tag-remove">&times;</button>
        </span>
    `).join('');
}

// Complete profile and save to Firestore
window.completeProfile = async function() {
    console.log('Starting profile completion...');
    
    // Validation
    const name = document.getElementById('profile-name').value.trim();
    const age = document.getElementById('profile-age').value.trim();
    const gender = document.getElementById('profile-gender').value;
    const bio = document.getElementById('profile-bio').value.trim();
    const state = document.getElementById('profile-state').value.trim();
    const city = document.getElementById('profile-city').value.trim();
    const profession = document.getElementById('profile-profession').value.trim();

    console.log('Form values:', { name, age, gender, bio, state, city, profession });

    if (!name || !age || !gender || !bio || !state || !city || !profession) {
        alert('Please fill in all required fields marked with *');
        return;
    }

    if (parseInt(age) < 18 || parseInt(age) > 100) {
        alert('Age must be between 18 and 100');
        return;
    }

    if (profileData.skills.length < 3) {
        alert('Please add at least 3 skills');
        return;
    }

    // Get "looking for" checkboxes
    const lookingForCheckboxes = document.querySelectorAll('.looking-for-checkbox:checked');
    if (lookingForCheckboxes.length === 0) {
        alert('Please select at least one option for "What are you looking for?"');
        return;
    }
    profileData.lookingFor = Array.from(lookingForCheckboxes).map(cb => cb.value);

    console.log('Profile data:', profileData);

    showLoading();

    try {
        // Check Firebase objects
        console.log('Firebase app:', firebase);
        console.log('Auth object:', auth);
        console.log('Firestore object:', db);
        console.log('Storage object:', storage);

        const user = auth.currentUser;
        console.log('Current user:', user);

        if (!user) {
            hideLoading();
            alert('No authenticated user found. Please log in again.');
            window.location.href = 'auth.html';
            return;
        }

        console.log('User authenticated:', user.uid, user.email);

        // Convert profile image to base64 if selected
        let profileImageUrl = '';
        let resumeUrl = ''; // Initialize resumeUrl variable
        if (selectedImageFile) {
            console.log('Processing profile image...');
            console.log('File details:', {
                name: selectedImageFile.name,
                size: selectedImageFile.size,
                type: selectedImageFile.type
            });
            
            try {
                // Validate file
                if (selectedImageFile.size > 2 * 1024 * 1024) { // 2MB limit for base64
                    alert('Image size must be less than 2MB');
                    hideLoading();
                    return;
                }
                
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(selectedImageFile.type)) {
                    alert('Only JPEG, PNG, GIF, and WebP images are allowed');
                    hideLoading();
                    return;
                }
                
                // Convert to base64
                console.log('Converting image to base64...');
                const reader = new FileReader();
                profileImageUrl = await new Promise((resolve, reject) => {
                    reader.onload = (e) => {
                        console.log('✅ Image converted to base64');
                        resolve(e.target.result);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(selectedImageFile);
                });
                
            } catch (imgError) {
                console.error('❌ Image processing error:', imgError);
                alert('Failed to process image. Continuing without profile picture.');
                profileImageUrl = '';
            }
        } else {
            console.log('No profile image selected, continuing without image');
        }

        // Create profile document in Firestore
        const profile = {
            uid: user.uid,
            name: name,
            age: parseInt(age),
            gender: gender,
            email: user.email,
            bio: bio,
            state: state,
            city: city,
            profession: profession,
            skills: profileData.skills,
            hobbies: profileData.hobbies,
            lookingFor: profileData.lookingFor,
            githubUrl: document.getElementById('github-url').value.trim(),
            linkedinUrl: document.getElementById('linkedin-url').value.trim(),
            profileImage: profileImageUrl,
            swipedRight: [],
            swipedLeft: [],
            matches: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log('Profile object to save:', profile);
        console.log('Attempting to save to Firestore collection: users, document:', user.uid);
        
        // Save to Firestore
        const docRef = db.collection('users').doc(user.uid);
        console.log('Document reference created:', docRef.path);
        
        // Check if we're in edit mode
        const editMode = localStorage.getItem('editMode');
        
        if (editMode === 'true') {
            // In edit mode: merge with existing data to preserve fields like swipedRight, swipedLeft, matches
            console.log('Edit mode: merging with existing data');
            const existingDoc = await docRef.get();
            if (existingDoc.exists) {
                const existingData = existingDoc.data();
                // Preserve existing data that shouldn't be overwritten
                profile.swipedRight = existingData.swipedRight || [];
                profile.swipedLeft = existingData.swipedLeft || [];
                profile.matches = existingData.matches || [];
                profile.createdAt = existingData.createdAt;
                // Keep existing profileImage if no new one uploaded
                if (!profileImageUrl && existingData.profileImage) {
                    profile.profileImage = existingData.profileImage;
                }
                // Keep existing resume if no new one uploaded
                if (!resumeUrl && existingData.resumeUrl) {
                    profile.resumeUrl = existingData.resumeUrl;
                }
            }
            await docRef.set(profile, { merge: true });
        } else {
            // New profile: create fresh
            await docRef.set(profile);
        }
        
        console.log('✅ Profile successfully saved to Firestore!');
        
        hideLoading();
        
        // Check if we're in edit mode and redirect accordingly
        const isEditMode = localStorage.getItem('editMode');
        if (isEditMode === 'true') {
            // Clear edit mode flag
            localStorage.removeItem('editMode');
            alert('Profile updated successfully!');
            window.location.href = 'app.html';
        } else {
            alert('Profile created successfully!');
            window.location.href = 'app.html';
        }
    } catch (error) {
        hideLoading();
        console.error('❌ Error creating profile:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', JSON.stringify(error, null, 2));
        alert('Error creating profile: ' + error.message + '\nCheck console for details.');
    }
}

// Profile management functions

let profileImageFile = null;

// Save profile to Firestore
async function saveProfile() {
    const name = document.getElementById('profile-name').value;
    const bio = document.getElementById('profile-bio').value;
    const skills = document.getElementById('profile-skills').value;
    const techStack = document.getElementById('profile-techstack').value;
    const github = document.getElementById('profile-github').value;
    const linkedin = document.getElementById('profile-linkedin').value;
    const interests = document.getElementById('profile-interests').value;
    const goals = document.getElementById('profile-goals').value;
    const role = document.getElementById('profile-role').value;

    if (!name || !bio || !skills) {
        alert('Please fill in at least name, bio, and skills');
        return;
    }

    showLoading();
    try {
        const user = auth.currentUser;
        let photoURL = user.photoURL || '';

        // Upload profile image if selected
        if (profileImageFile) {
            const storageRef = storage.ref(`profiles/${user.uid}/profile.jpg`);
            await storageRef.put(profileImageFile);
            photoURL = await storageRef.getDownloadURL();
        }

        // Save profile to Firestore
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            name: name,
            email: user.email,
            bio: bio,
            skills: skills.split(',').map(s => s.trim()).filter(s => s),
            techStack: techStack.split(',').map(s => s.trim()).filter(s => s),
            github: github,
            linkedin: linkedin,
            interests: interests.split(',').map(s => s.trim()).filter(s => s),
            goals: goals,
            role: role,
            photoURL: photoURL,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            swipedRight: [],
            swipedLeft: [],
            matches: []
        });

        hideLoading();
        alert('Profile saved successfully!');
        
        // Force UI update to show main app
        showMainApp();
        loadSwipeCards();
    } catch (error) {
        hideLoading();
        console.error('Error saving profile:', error);
        alert('Error saving profile: ' + error.message);
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// FINAL CHECK - Confirm all functions are globally accessible
console.log('=== PROFILE.JS FULLY LOADED ===');
console.log('window.renderProfileCard:', typeof window.renderProfileCard);
console.log('window.showEditProfile:', typeof window.showEditProfile);
console.log('window.previewImage:', typeof window.previewImage);
console.log('window.previewResume:', typeof window.previewResume);
console.log('window.addSkill:', typeof window.addSkill);
console.log('window.removeSkill:', typeof window.removeSkill);
console.log('window.addHobby:', typeof window.addHobby);
console.log('window.removeHobby:', typeof window.removeHobby);
console.log('window.completeProfile:', typeof window.completeProfile);
console.log('================================');
