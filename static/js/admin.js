// Variables globales
let allCats = [];
let currentPage = 1;
let itemsPerPage = 12;
let totalPages = 0;
let currentCatToBan = null;

// Éléments DOM
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const listingContainer = document.querySelector('.listing-container');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const banModal = document.getElementById('ban-modal');
const closeModal = document.querySelector('.close-modal');
const cancelBanBtn = document.getElementById('cancel-ban');
const confirmBanBtn = document.getElementById('confirm-ban');
const catToBanInfo = document.getElementById('cat-to-ban-info');

// Fonctions d'API
async function fetchAllCats() {
    try {
        const response = await fetch('/api/admin/cats');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des chats');
        }
        allCats = await response.json();
        totalPages = Math.ceil(allCats.length / itemsPerPage);
        displayCats(1);
    } catch (error) {
        console.error('Erreur:', error);
        listingContainer.innerHTML = '<div class="error">Impossible de charger les annonces. Veuillez réessayer plus tard.</div>';
    }
}

async function banCat(catId) {
    try {
        const response = await fetch('/api/admin/ban-cat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cat_id: catId })
        });

        if (!response.ok) {
            throw new Error('Erreur lors du bannissement de l\'annonce');
        }

        const result = await response.json();
        
        if (result.success) {
            // Supprimer le chat de la liste et rafraîchir l'affichage
            allCats = allCats.filter(cat => cat.id !== catId);
            totalPages = Math.ceil(allCats.length / itemsPerPage);
            
            // Si la page actuelle est maintenant vide et ce n'est pas la première page
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }
            
            displayCats(currentPage);
            return true;
        } else {
            throw new Error(result.message || 'Erreur inconnue');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur: ${error.message}`);
        return false;
    }
}

// Fonctions d'affichage
function displayCats(page) {
    currentPage = page;
    
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const catsToDisplay = allCats.slice(start, end);
    
    if (catsToDisplay.length === 0 && allCats.length > 0) {
        listingContainer.innerHTML = '<div class="no-cats">Aucune annonce ne correspond à votre recherche.</div>';
    } else if (allCats.length === 0) {
        listingContainer.innerHTML = '<div class="no-cats">Aucune annonce disponible.</div>';
    } else {
        listingContainer.innerHTML = '';
        
        catsToDisplay.forEach(cat => {
            const card = document.createElement('div');
            card.classList.add('cat-card-admin');
            card.dataset.id = cat.id;
            
            card.innerHTML = `
                <img src="${cat.image_url}" class="cat-image" alt="${cat.nom}">
                <div class="cat-info">
                    <h3>${cat.nom}</h3>
                    <p>${cat.race_age}</p>
                </div>
                <div class="cat-actions">
                    <button class="btn primary-btn view-btn" data-id="${cat.id}">Voir</button>
                    <button class="btn danger-btn ban-btn" data-id="${cat.id}">Bannir</button>
                </div>
            `;
            
            listingContainer.appendChild(card);
        });
        
        // Ajouter les événements aux boutons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => viewCatDetails(btn.dataset.id));
        });
        
        document.querySelectorAll('.ban-btn').forEach(btn => {
            btn.addEventListener('click', () => openBanModal(btn.dataset.id));
        });
    }
    
    // Mettre à jour la pagination
    updatePaginationControls();
}

function updatePaginationControls() {
    pageInfo.textContent = `Page ${currentPage} sur ${totalPages || 1}`;
    
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

function viewCatDetails(catId) {
    const cat = allCats.find(c => c.id == catId);
    if (cat) {
        window.open(cat.lien, '_blank');
    }
}

function openBanModal(catId) {
    const cat = allCats.find(c => c.id == catId);
    if (cat) {
        currentCatToBan = cat;
        
        catToBanInfo.innerHTML = `
            <p><strong>Nom:</strong> ${cat.nom}</p>
            <p><strong>Race/Âge:</strong> ${cat.race_age}</p>
        `;
        
        banModal.classList.remove('hidden');
    }
}

function closeBanModal() {
    banModal.classList.add('hidden');
    currentCatToBan = null;
}

function filterCats() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        fetchAllCats(); // Réinitialiser à toutes les annonces
        return;
    }
    
    const filteredCats = allCats.filter(cat => {
        return (
            cat.nom.toLowerCase().includes(searchTerm) ||
            cat.race_age.toLowerCase().includes(searchTerm) ||
            (cat.description && cat.description.toLowerCase().includes(searchTerm))
        );
    });
    
    if (filteredCats.length === 0) {
        listingContainer.innerHTML = '<div class="no-cats">Aucune annonce ne correspond à votre recherche.</div>';
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
        pageInfo.textContent = 'Page 0 sur 0';
    } else {
        allCats = filteredCats; // Temporairement remplacer allCats par les résultats filtrés
        totalPages = Math.ceil(filteredCats.length / itemsPerPage);
        currentPage = 1;
        displayCats(currentPage);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Charger toutes les annonces
    fetchAllCats();
    
    // Recherche
    searchBtn.addEventListener('click', filterCats);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            filterCats();
        }
    });
    
    // Pagination
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            displayCats(currentPage - 1);
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            displayCats(currentPage + 1);
        }
    });
    
    // Modal
    closeModal.addEventListener('click', closeBanModal);
    cancelBanBtn.addEventListener('click', closeBanModal);
    
    confirmBanBtn.addEventListener('click', () => {
        if (currentCatToBan) {
            banCat(currentCatToBan.id).then(success => {
                if (success) {
                    closeBanModal();
                }
            });
        }
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === banModal) {
            closeBanModal();
        }
    });
});