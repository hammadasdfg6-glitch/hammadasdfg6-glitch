const fs = require('fs');
const https = require('https');

const username = 'hammadasdfg6-glitch';
const apiUrl = `https://github-readme-stats-eight-theta.vercel.app/api?username=${username}&theme=radical&hide_border=true&include_all_commits=true&count_private=true&bg_color=151515&title_color=FFD700&icon_color=FFD700&text_color=9f9f9f&v=1`;

function generateRollingNumberSVG(numberStr, x, y, id) {
    const digits = numberStr.toString().split('');
    let svg = '';
    const charWidth = 8.5; // approx width for numbers
    const lineHeight = 16;
    
    const clipId = `clip-${id}`;
    
    svg += `<defs><clipPath id="${clipId}"><rect x="${x}" y="${y - 12}" width="${digits.length * charWidth + 5}" height="${lineHeight + 2}" /></clipPath></defs>`;
    svg += `<g clip-path="url(#${clipId})">`;
    
    digits.forEach((digit, index) => {
        const d = parseInt(digit);
        if (isNaN(d)) {
            svg += `<text class="stat" x="${x + index * charWidth}" y="${y}">${digit}</text>`;
            return;
        }
        
        // Build column: 0 to 9 and then the target digit for a true "spin" effect
        let column = '';
        const spinCount = 10 + d; 
        for (let i = 0; i <= spinCount; i++) {
            column += `<tspan x="${x + index * charWidth}" y="${y + i * lineHeight}">${i % 10}</tspan>`;
        }
        
        const delay = 0.5 + (index * 0.2); 
        const duration = 1.5;
        
        svg += `
        <g style="animation: spin-${d} ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards;">
            <text class="stat">${column}</text>
        </g>
        `;
    });
    
    svg += `</g>`;
    return svg;
}

// Generate the CSS keyframes for digits 0-9
let customStyles = '<style>\n';
for (let i = 0; i <= 9; i++) {
    const spinCount = 10 + i;
    const yTransform = -(spinCount * 16); // lineHeight is 16
    customStyles += `@keyframes spin-${i} { from { transform: translateY(0); } to { transform: translateY(${yTransform}px); } }\n`;
}
customStyles += '</style>\n';

https.get(apiUrl, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        // Regex to find only the specific <text> tags with data-testid
        const regex = /<text([^>]*data-testid="([^"]+)"[^>]*)>([\s\S]*?)<\/text>/g;
        
        let modifiedSvg = data.replace(regex, (match, attrs, id, number) => {
            // Only process the statistic rows
            if (['stars', 'commits', 'prs', 'issues', 'contribs'].indexOf(id) === -1) {
                return match; // return original string unchanged
            }
            
            // Extract x and y from attrs
            const xMatch = attrs.match(/x="([^"]+)"/);
            const yMatch = attrs.match(/y="([^"]+)"/);
            const x = xMatch ? parseFloat(xMatch[1]) : 170;
            const y = yMatch ? parseFloat(yMatch[1]) : 12.5;
            
            return generateRollingNumberSVG(number.trim(), x, y, id);
        });
        
        // Enhance Rank Circle animation
        // Find: animation: rankAnimation 1s forwards ease-in-out;
        modifiedSvg = modifiedSvg.replace(
            /animation:\s*rankAnimation\s*1s\s*forwards\s*ease-in-out;/g,
            'animation: rankAnimation 2s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); animation-delay: 1s; stroke-dashoffset: 251.32741228718345;'
        );

        modifiedSvg = modifiedSvg.replace('</style>', customStyles + '</style>');

        fs.writeFileSync('animated-stats.svg', modifiedSvg);
        console.log('Successfully generated animated-stats.svg');
    });
});
