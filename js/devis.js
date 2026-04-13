document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  const promptInput = document.getElementById('promptInput');
  const loader = document.getElementById('loader');
  const quoteResult = document.getElementById('quoteResult');
  const demoFooter = document.getElementById('demoFooter');

  // Rendu de l'Euro
  const formatEUR = (num) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(num);
  };

  generateBtn.addEventListener('click', async () => {
    const promptText = promptInput.value.trim();
    if (!promptText) {
      alert("Veuillez décrire une intervention pour générer le devis !");
      return;
    }

    // UI Updates : Loading state
    generateBtn.classList.add('loading');
    generateBtn.textContent = 'Génération magique en cours...';
    quoteResult.style.display = 'none';
    demoFooter.style.display = 'none';
    loader.style.display = 'block';

    try {
      // Appel au backend
      const response = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: promptText })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erreur de connexion API.");
      }

      const quoteData = await response.json();
      
      // Mappage des données sur le JSON formaté du "Devis"
      document.getElementById('clientName').textContent = quoteData.client.name;
      document.getElementById('clientAddress').textContent = quoteData.client.address;
      document.getElementById('quoteNumber').textContent = quoteData.quoteNumber;
      document.getElementById('quoteDate').textContent = quoteData.quoteDate;
      document.getElementById('validityDays').textContent = quoteData.validityDays || 30;

      // Table items
      const tbody = document.getElementById('itemsBody');
      tbody.innerHTML = '';
      
      quoteData.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.description}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatEUR(item.priceHT)}</td>
          <td class="text-right" style="font-weight: 500;">${formatEUR(item.totalHT)}</td>
        `;
        tbody.appendChild(tr);
      });

      // Totaux
      document.getElementById('subtotalHT').textContent = formatEUR(quoteData.subtotalHT);
      document.getElementById('taxAmount').textContent = formatEUR(quoteData.taxAmount);
      document.getElementById('totalTTC').textContent = formatEUR(quoteData.totalTTC);

      // Animation d'apparition
      loader.style.display = 'none';
      quoteResult.style.display = 'block';
      demoFooter.style.display = 'block';

      // Scroll magique vers le devis
      quoteResult.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
      console.error(error);
      alert(`Une erreur est survenue : ${error.message}`);
      loader.style.display = 'none';
    } finally {
      generateBtn.classList.remove('loading');
      generateBtn.textContent = 'Générer le devis instantanément';
    }
  });

  // Gérer la validation au clavier ("Entrée")
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateBtn.click();
    }
  });
});
