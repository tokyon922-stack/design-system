const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function generateDesignSystemWithAI(brand) {
    const prompt = `أنت مصمم نظام تصميم احترافي. قم بإنشاء نظام تصميم كامل بناءً على: "${brand}"
    
    أرجع JSON بالضبط بهذا الهيكل (بدون شرح إضافي):
    {
      "colors": {
        "primary": {
          "main": "#hex",
          "light": "#hex",
          "dark": "#hex"
        },
        "secondary": {
          "main": "#hex",
          "light": "#hex",
          "dark": "#hex"
        },
        "neutral": {
          "white": "#ffffff",
          "black": "#000000",
          "gray50": "#f9fafb",
          "gray100": "#f3f4f6",
          "gray200": "#e5e7eb",
          "gray300": "#d1d5db",
          "gray400": "#9ca3af",
          "gray500": "#6b7280",
          "gray600": "#4b5563",
          "gray700": "#374151",
          "gray800": "#1f2937",
          "gray900": "#111827"
        },
        "semantic": {
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
          "info": "#3b82f6"
        }
      },
      "typography": {
        "heading": {
          "font": "font-name",
          "weight": "number"
        },
        "body": {
          "font": "font-name",
          "weight": "number"
        },
        "mono": {
          "font": "monospace-font"
        }
      },
      "spacing": {
        "xs": 4,
        "sm": 8,
        "md": 16,
        "lg": 24,
        "xl": 32,
        "2xl": 48
      }
    }`;

    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-opus-4-1',
            max_tokens: 1000,
            messages: [
                { role: 'user', content: prompt }
            ]
        })
    });

    const data = await response.json();
    const content = data.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse design system');
    return JSON.parse(jsonMatch[0]);
}

function generateDesignSystemLocal(brand) {
    const brandLower = brand.toLowerCase();
    const colorSchemes = {
        'tech': {
            primary: { main: '#0066ff', light: '#3385ff', dark: '#0052cc' },
            secondary: { main: '#667eea', light: '#8fa3f1', dark: '#4c63d2' }
        },
        'elegant': {
            primary: { main: '#1a1a1a', light: '#4d4d4d', dark: '#0d0d0d' },
            secondary: { main: '#d4af37', light: '#e6c547', dark: '#b39e1f' }
        },
        'modern': {
            primary: { main: '#667eea', light: '#8fa3f1', dark: '#4c63d2' },
            secondary: { main: '#764ba2', light: '#9b6fb9', dark: '#5a3780' }
        },
        'playful': {
            primary: { main: '#ff6b6b', light: '#ff8787', dark: '#dd5656' },
            secondary: { main: '#4ecdc4', light: '#6ee7de', dark: '#3ba99e' }
        },
        'minimal': {
            primary: { main: '#000000', light: '#333333', dark: '#000000' },
            secondary: { main: '#ffffff', light: '#f5f5f5', dark: '#e0e0e0' }
        }
    };
    let colors = colorSchemes['modern'];
    for (const [key, scheme] of Object.entries(colorSchemes)) {
        if (brandLower.includes(key)) {
            colors = scheme;
            break;
        }
    }
    return {
        colors: {
            primary: colors.primary,
            secondary: colors.secondary,
            neutral: {
                white: '#ffffff',
                black: '#000000',
                gray50: '#f9fafb',
                gray100: '#f3f4f6',
                gray200: '#e5e7eb',
                gray300: '#d1d5db',
                gray400: '#9ca3af',
                gray500: '#6b7280',
                gray600: '#4b5563',
                gray700: '#374151',
                gray800: '#1f2937',
                gray900: '#111827'
            },
            semantic: {
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                info: '#3b82f6'
            }
        },
        typography: {
            heading: { font: "'Poppins', sans-serif", weight: 700 },
            body: { font: "'Inter', sans-serif", weight: 400 },
            mono: { font: "'Fira Code', monospace" }
        },
        spacing: {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 24,
            xl: 32,
            '2xl': 48
        }
    };
}

app.post('/api/generate-design-system', async (req, res) => {
    try {
        const { brand } = req.body;
        if (!brand) {
            return res.status(400).json({ error: 'Brand name required' });
        }
        let designSystem;
        if (process.env.ANTHROPIC_API_KEY) {
            try {
                designSystem = await generateDesignSystemWithAI(brand);
            } catch (error) {
                console.log('AI generation failed, using local:', error.message);
                designSystem = generateDesignSystemLocal(brand);
            }
        } else {
            designSystem = generateDesignSystemLocal(brand);
        }
        res.json(designSystem);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate design system' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Design System Generator running on http://localhost:${PORT}`);
});
