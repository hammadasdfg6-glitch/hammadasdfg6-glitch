const fs = require('fs');
const https = require('https');

const apiUrl = 'https://github-readme-streak-stats.herokuapp.com/?user=hammadasdfg6-glitch&theme=radical&hide_border=true&background=151515&ring=FFD700&fire=FFD700&currStreakNum=9f9f9f&v=1';

https.get(apiUrl, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (data.includes('Failed to retrieve') || data.includes('Something went wrong')) {
            console.error('API returned an error. Aborting to preserve the previous SVG.');
            process.exit(1);
        }
        
        let customStyles = '\n';
        let styleCounter = 100;

        function generateRollingNumberSVG(numberStr, yStr, matchStr) {
            const digits = numberStr.toString().split('');
            let svg = '';
            const charWidth = 16;
            const lineHeight = 28;
            
            const clipId = `clip-streak-${styleCounter}`;
            const y = parseFloat(yStr);
            
            svg += `<defs><clipPath id="${clipId}"><rect x="0" y="${y - 28}" width="100" height="35" /></clipPath></defs>`;
            svg += `<g transform="translate(-50, 0)" clip-path="url(#${clipId})">`;
            svg += `<g transform="translate(50, 0)">`;
            
            digits.forEach((digit, index) => {
                const d = parseInt(digit);
                const dx = (index - (digits.length - 1) / 2) * charWidth;
                
                if (isNaN(d)) {
                    svg += `<text x="${dx}" y="${y}" stroke-width="0" text-anchor="middle" fill="#9f9f9f" stroke="none" font-family='"Segoe UI", Ubuntu, sans-serif' font-weight="700" font-size="28px">${digit}</text>`;
                    return;
                }
                
                let column = '';
                const spinCount = 10 + d; 
                for (let i = 0; i <= spinCount; i++) {
                    column += `<tspan x="${dx}" y="${y + i * lineHeight}">${i % 10}</tspan>`;
                }
                
                const delay = 0.5 + (index * 0.2); 
                const duration = 1.5;
                const totalCycle = 7.5;
                
                const pStart = (delay / totalCycle) * 100;
                const pEnd = ((delay + duration) / totalCycle) * 100;
                const yTransform = -(spinCount * lineHeight);
                
                const animName = `spin-${styleCounter}`;
                const className = `col-${styleCounter}`;
                styleCounter++;
                
                customStyles += `.${className} { animation: ${animName} ${totalCycle}s infinite; }\n`;
                customStyles += `@keyframes ${animName} {
                    0% { transform: translateY(0); }
                    ${pStart}% { transform: translateY(0); animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1); }
                    ${pEnd}% { transform: translateY(${yTransform}px); }
                    100% { transform: translateY(${yTransform}px); }
                }\n`;
                
                svg += `<g class="${className}">`;
                
                let colorMatch = matchStr.match(/fill='([^']+)'/);
                let color = colorMatch ? colorMatch[1] : '#9f9f9f';
                
                svg += `<text stroke-width="0" text-anchor="middle" fill="${color}" stroke="none" font-family='"Segoe UI", Ubuntu, sans-serif' font-weight="700" font-size="28px">${column}</text>`;
                svg += `</g>`;
            });
            
            svg += `</g>`; // Close compensating translate(50, 0)
            svg += `</g>`; // Close clipPath group
            return svg;
        }

        const regex = /<text[^>]*\by='([^']+)'[^>]*>\s*(\d+)\s*<\/text>/g;
        let modifiedSvg = data.replace(regex, (match, y, number) => {
            return generateRollingNumberSVG(number.trim(), y, match);
        });
        
        modifiedSvg = modifiedSvg.replace('</style>', customStyles + '</style>');
        
        fs.writeFileSync('animated-streak-v2.svg', modifiedSvg);
        console.log('Successfully generated animated-streak-v2.svg');
    });
});
