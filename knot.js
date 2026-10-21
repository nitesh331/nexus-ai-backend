const fs = require('fs');

const svg = `
<svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
  <style>
    .rope { fill: none; stroke: #8B5A2B; stroke-width: 6; stroke-linecap: round; }
    .rope-dark { fill: none; stroke: #4A2F1D; stroke-width: 6; stroke-dasharray: 1 3; }
    .shadow { stroke: #000; stroke-width: 8; }
  </style>
  
  <!-- Left rope (the loop/bight) -->
  <path id="left-rope" d="M 10,15 L 45,15 C 55,15 55,30 45,30 L 10,30" class="rope" />
  
  <!-- Right rope (the intertwined part) -->
  <!-- Goes left to 55, up to 10, left to 35, down to 35, right to 55, right to 90 -->
  <path id="right-rope" d="M 90,20 L 55,20 C 45,20 40,10 35,10 C 25,10 25,35 35,35 C 40,35 45,25 55,25 L 90,25" class="rope" />
</svg>
`;

fs.writeFileSync('test_knot.svg', svg);
console.log("Written to test_knot.svg");
