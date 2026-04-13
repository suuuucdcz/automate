import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Config
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Fonction pour contacter Groq
async function generateQuoteFromGroq(promptText) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY non configurée dans .env');
  }

  const systemPrompt = `Tu es un expert administratif français spécialisé dans l'émission de devis professionnels (Bâtiment, Service, IT).
Le but est de convertir une description naturelle de travaux ou services en un devis détaillé, réaliste et respectant la loi.
Ton entreprise s'appelle 'Derovia Corp.', adresse: '123 Avenue des Champs, 75000 Paris', SIRET: '900 000 000 00018'.
La TVA applicable est toujours de 20%.

Génère un faux client de manière pertinente par rapport à la demande si aucun nom n'est donné, et invente les détails des frais et pièces de manière ultra-réaliste pour arriver à un vrai devis.
Analyse la demande suivante: "${promptText}".

Tu DOIS répondre STRICTEMENT avec un objet JSON valide (aucun autre texte avant ni après).
Le format JSON attendu est exactemment le suivant :
{
  "client": {
    "name": "Nom du client",
    "address": "Adresse complète"
  },
  "quoteDate": "Date du jour au format JJ/MM/AAAA",
  "quoteNumber": "DEV-2026-X",
  "items": [
    {
      "description": "Nom détaillé de la prestation",
      "quantity": 1,
      "priceHT": 150.00,
      "totalHT": 150.00
    }
  ],
  "subtotalHT": 150.00,
  "taxAmount": 30.00,
  "totalTTC": 180.00,
  "validityDays": 30
}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erreur API Groq: ${err}`);
  }

  const data = await response.json();
  const quoteJsonText = data.choices[0].message.content;
  return JSON.parse(quoteJsonText);
}

// API endpoint
app.post('/api/generate-quote', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Le champ prompt est requis.' });
    }
    
    const quoteData = await generateQuoteFromGroq(prompt);
    res.json(quoteData);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la génération du devis' });
  }
});

// Lancement
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Le dossier public est : ${__dirname}`);
});
