const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the Gemini generation block for direct command (approx lines 476-540)
code = code.replace(
  /try \{\s+const userKey = getActiveGeminiKey\(\);[\s\S]*?\} catch \(error: any\) \{\s+console\.error\('Erro na geração de imagem Gemini:', error\);[\s\S]*?\}/,
  `try {
          const userKey = getActiveGeminiKey() || userApiKey;
          if (!userKey || userKey.trim() === '') {
            setShowKeyManager(true);
            throw new Error('Chave API necessária para geração de imagens');
          }

          let imageUrl = '';

          if (userKey.startsWith('sk-or')) {
            // Use OpenRouter
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${userKey.trim()}\`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'NEURAL-X Mobile'
              },
              body: JSON.stringify({
                model: "pollinations/pno-fast",
                messages: [{ role: 'user', content: structuredPrompt }]
              })
            });
            if (!response.ok) throw new Error('Falha na geração OpenRouter');
            const data = await response.json();
            const content = data.choices[0].message.content;
            const match = content.match(/\\!\\[.*?\\]\\((.*?)\\)/);
            if (match) imageUrl = match[1];
            else imageUrl = \`https://image.pollinations.ai/prompt/\${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true\`;
          } else {
            // Use Gemini API correctly
            const ai = new GoogleGenAI({ apiKey: userKey });
            const response = await ai.models.generateImages({
              model: 'imagen-3.0-generate-002',
              prompt: structuredPrompt,
              config: {
                numberOfImages: 1,
                aspectRatio: imageRatio === '1:1' ? '1:1' : imageRatio === '16:9' ? '16:9' : imageRatio === '4:3' ? '4:3' : '1:1',
                outputMimeType: 'image/jpeg'
              }
            });
            if (response.generatedImages && response.generatedImages.length > 0) {
              imageUrl = \`data:image/jpeg;base64,\${response.generatedImages[0].image.imageBytes}\`;
            } else {
              throw new Error('Nenhuma imagem retornada pelo Gemini.');
            }
          }

          if (imageUrl) {
            const assistantMessage: Message = {
              role: 'assistant',
              content: \`IMAGEM GERADA: \${prompt.toUpperCase()}\`,
              id: (Date.now() + 1).toString(),
              timestamp: new Date(),
              type: 'image',
              imageUrl: imageUrl,
              prompt: structuredPrompt
            };

            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
            return;
          }
        } catch (error: any) {
          console.error('Erro na geração de imagem:', error);
          setMessages(prev => [...prev, {
            role: 'system',
            content: \`ERRO NA GERAÇÃO: \${error.message || 'Falha desconhecida'}.\`,
            id: Date.now().toString(),
            timestamp: new Date()
          }]);
        }`
);

// Do the same for the auto-generation block (around lines 667-731)
code = code.replace(
  /try \{\s+const userKey = getActiveGeminiKey\(\);[\s\S]*?catch \(err: any\) \{\s+console\.error\('Erro na geração automática Gemini:', err\);[\s\S]*?\}/,
  `try {
          const userKey = getActiveGeminiKey() || userApiKey;
          if (!userKey || userKey.trim() === '') {
            setShowKeyManager(true);
            throw new Error('Chave API necessária para geração de imagens');
          }

          let imageUrl = '';

          if (userKey.startsWith('sk-or')) {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${userKey.trim()}\`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'NEURAL-X Mobile'
              },
              body: JSON.stringify({
                model: "pollinations/pno-fast",
                messages: [{ role: 'user', content: structuredPrompt }]
              })
            });
            if (!response.ok) throw new Error('Falha na geração OpenRouter');
            const data = await response.json();
            const content = data.choices[0].message.content;
            const match = content.match(/\\!\\[.*?\\]\\((.*?)\\)/);
            if (match) imageUrl = match[1];
            else imageUrl = \`https://image.pollinations.ai/prompt/\${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true\`;
          } else {
            const ai = new GoogleGenAI({ apiKey: userKey });
            const response = await ai.models.generateImages({
              model: 'imagen-3.0-generate-002',
              prompt: structuredPrompt,
              config: {
                numberOfImages: 1,
                aspectRatio: imageRatio === '1:1' ? '1:1' : imageRatio === '16:9' ? '16:9' : imageRatio === '4:3' ? '4:3' : '1:1',
                outputMimeType: 'image/jpeg'
              }
            });
            if (response.generatedImages && response.generatedImages.length > 0) {
              imageUrl = \`data:image/jpeg;base64,\${response.generatedImages[0].image.imageBytes}\`;
            } else {
              throw new Error('Nenhuma imagem retornada pelo Gemini.');
            }
          }

          if (imageUrl) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: \`IMAGEM GERADA: \${prompt.toUpperCase()}\`,
              id: (Date.now() + 1).toString(),
              timestamp: new Date(),
              type: 'image',
              imageUrl: imageUrl,
              prompt: structuredPrompt
            }]);
          }
        } catch (err: any) {
          console.error('Erro na geração automática:', err);
          setMessages(prev => [...prev, {
            role: 'system',
            content: \`FALHA NA GERAÇÃO DE IMAGEM: \${err.message || 'Erro desconhecido'}.\`,
            id: Date.now().toString(),
            timestamp: new Date()
          }]);
        }`
);

fs.writeFileSync('src/App.tsx', code);
