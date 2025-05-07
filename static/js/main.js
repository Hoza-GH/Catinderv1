// Variables globales
let userId = null;
let username = null;
let cats = [];
let currentCatIndex = 0;
let likedCats = [];

// Éléments DOM
const cardContainer = document.getElementById('card-container');
const likeBtn = document.getElementById('like-btn');
const dislikeBtn = document.getElementById('dislike-btn');
const homeLink = document.getElementById('home-link');
const likesLink = document.getElementById('likes-link');
const swipeContainer = document.getElementById('swipe-container');
const likesContainer = document.getElementById('likes-container');
const likedCatsGrid = document.getElementById('liked-cats-grid');
const modal = document.getElementById('cat-detail-modal');
const closeModal = document.querySelector('.close-modal');
const modalCatInfo = document.getElementById('modal-cat-info');
const userInfoElement = document.getElementById('user-info');
const logoutButton = document.getElementById('logout-btn');

// Fonctions d'API
async function getCurrentUser() {
    try {
        const response = await fetch('/api/user');
        
        if (!response.ok) {
            throw new Error('Non authentifié');
        }
        
        const userData = await response.json();
        userId = userData.id;
        username = userData.username;
        
        // Mettre à jour l'affichage avec le nom d'utilisateur
        if (userInfoElement) {
            userInfoElement.textContent = username;
        }
        
        return userData;
    } catch (error) {
        console.error('Erreur:', error);
        window.location.href = '/login';
        return null;
    }
}

async function fetchCats() {
    try {
        const response = await fetch('/api/cats');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des chats');
        }
        cats = await response.json();
        displayCurrentCat();
    } catch (error) {
        console.error('Erreur:', error);
        cardContainer.innerHTML = '<div class="error">Impossible de charger les chats. Veuillez réessayer plus tard.</div>';
    }
}

async function fetchLikedCats() {
    try {
        const response = await fetch('/api/likes');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des chats aimés');
        }
        likedCats = await response.json();
        displayLikedCats();
    } catch (error) {
        console.error('Erreur:', error);
        likedCatsGrid.innerHTML = '<div class="error">Impossible de charger vos chats aimés. Veuillez réessayer plus tard.</div>';
    }
}

async function likeCat(catId) {
    try {
        const response = await fetch('/api/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cat_id: catId })
        });

        if (!response.ok) {
            throw new Error('Erreur lors du like');
        }

        // La requête a réussi, on continue avec le swipe
        return true;
    } catch (error) {
        console.error('Erreur:', error);
        return false;
    }
}

// Fonctions d'affichage
function displayCurrentCat() {
    if (cats.length === 0 || currentCatIndex >= cats.length) {
        cardContainer.innerHTML = '<div class="no-more-cats">Plus de chats disponibles pour le moment.</div>';
        return;
    }

    const cat = cats[currentCatIndex];
    
    // Créer une nouvelle carte
    const card = document.createElement('div');
    card.classList.add('cat-card');
    card.dataset.id = cat.id;
    
    // Ajouter l'image et les infos
    card.innerHTML = `
        <img src="${cat.image_url}" class="cat-image" alt="${cat.nom}">
        <div class="cat-info">
            <h3>${cat.nom}</h3>
            <p>${cat.race_age}</p>
        </div>
    `;
    
    // Ajouter la carte au container
    cardContainer.innerHTML = '';
    cardContainer.appendChild(card);
    
    // Ajouter l'événement pour ouvrir le modal sur clic
    card.addEventListener('click', () => openCatDetails(cat));
}

function displayLikedCats() {
    if (likedCats.length === 0) {
        likedCatsGrid.innerHTML = '<div class="no-likes">Vous n\'avez pas encore aimé de chats.</div>';
        return;
    }
    
    likedCatsGrid.innerHTML = '';
    
    likedCats.forEach(cat => {
        const card = document.createElement('div');
        card.classList.add('liked-cat-card');
        
        card.innerHTML = `
            <img src="${cat.image_url}" alt="${cat.nom}">
            <div class="cat-info">
                <h3>${cat.nom}</h3>
                <p>${cat.race_age}</p>
            </div>
        `;
        
        card.addEventListener('click', () => openCatDetails(cat));
        likedCatsGrid.appendChild(card);
    });
}

function openCatDetails(cat) {
    // Préparer le contenu du modal
    let autresImages = '';
    if (cat.autres_images && cat.autres_images !== '') {
        const images = cat.autres_images.split(', ').slice(0, 2); // Limiter à 2 images supplémentaires
        autresImages = images.map(img => `<img src="${img}" alt="${cat.nom}">`).join('');
    }
    
    modalCatInfo.innerHTML = `
        <h2>${cat.nom}</h2>
        <p class="race-age">${cat.race_age}</p>
        <img src="${cat.image_url}" alt="${cat.nom}">
        ${autresImages}
        <div class="description">
            <h3>Description</h3>
            <p>${cat.description}</p>
        </div>
        <a href="${cat.lien}" target="_blank" class="more-info-link">Plus d'informations</a>
    `;
    
    // Afficher le modal
    modal.classList.remove('hidden');
}

// Actions de swipe
function swipeLeft() {
    const currentCard = document.querySelector('.cat-card');
    if (currentCard) {
        currentCard.classList.add('swiped-left');
        setTimeout(() => {
            currentCatIndex++;
            displayCurrentCat();
        }, 300);
    }
}

function swipeRight() {
    const currentCard = document.querySelector('.cat-card');
    if (currentCard) {
        const catId = currentCard.dataset.id;
        
        // Animation de swipe
        currentCard.classList.add('swiped-right');
        
        // Like le chat
        likeCat(catId).then(success => {
            if (success) {
                setTimeout(() => {
                    currentCatIndex++;
                    displayCurrentCat();
                }, 300);
            } else {
                // En cas d'erreur, on retire l'animation et on laisse l'utilisateur réessayer
                currentCard.classList.remove('swiped-right');
            }
        });
    }
}

// Navigation
function showSwipeView() {
    swipeContainer.classList.remove('hidden');
    likesContainer.classList.add('hidden');
    homeLink.classList.add('active');
    likesLink.classList.remove('active');
    
    // Recharger les chats si nécessaire
    if (cats.length === 0 || currentCatIndex >= cats.length) {
        fetchCats();
    }
}

function showLikesView() {
    swipeContainer.classList.add('hidden');
    likesContainer.classList.remove('hidden');
    homeLink.classList.remove('active');
    likesLink.classList.add('active');
    
    fetchLikedCats();
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Vérifier si l'utilisateur est connecté
    const user = await getCurrentUser();
    
    if (!user) {
        return; // Redirection vers /login déjà gérée dans getCurrentUser
    }
    
    // Charger les premiers chats
    fetchCats();
    
    // Boutons de swipe
    likeBtn.addEventListener('click', swipeRight);
    dislikeBtn.addEventListener('click', swipeLeft);
    
    // Navigation
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSwipeView();
    });
    
    likesLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLikesView();
    });
    
    // Modal
    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
    
    // Gérer la déconnexion
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/logout';
        });
    }
    
    // Swipe tactile
    let touchStartX = 0;
    let touchEndX = 0;
    
    cardContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    cardContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50; // Seuil minimum pour considérer un swipe
        
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe gauche
            swipeLeft();
        } else if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe droite
            swipeRight();
        }
    }
});