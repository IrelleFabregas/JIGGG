document.addEventListener("DOMContentLoaded", () => {
    fetch('../php/fetchSummary.php')
        .then(res => res.json())
        .then(data => {
            const trcBody = document.getElementById('trcSummaryBody');
            const eppiBody = document.getElementById('eppiSummaryBody');
            
            const fillTable = (body, rows) => {
                body.innerHTML = ''; 
                const totalRowsNeeded = 7;
                
                // Initialize counters for the Total row
                let grandQty = 0;
                let grandGood = 0;
                let grandNG = 0;

                for (let i = 0; i < totalRowsNeeded; i++) {
                    const tr = document.createElement('tr');
                    const item = rows[i]; 

                    if (item) {
                        // Accumulate totals
                        grandQty += parseInt(item.equipment_qty) || 0;
                        grandGood += parseInt(item.good) || 0;
                        grandNG += parseInt(item.not_good) || 0;

                        tr.innerHTML = `
                            <td>${item.area}</td>
                            <td>${item.equipment_qty}</td>
                            <td class="text-good">${item.good}</td>
                            <td class="text-ng">${item.not_good}</td>
                        `;
                    } else {
                        tr.innerHTML = `
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                        `;
                    }
                    body.appendChild(tr);
                }

                // Append the Total Row at the very bottom
                const totalRow = document.createElement('tr');
                totalRow.className = 'total-row'; // For specific styling
                totalRow.innerHTML = `
                    <td style="font-weight: bold;">TOTAL</td>
                    <td style="font-weight: bold;">${grandQty}</td>
                    <td class="text-good" style="font-weight: bold;">${grandGood}</td>
                    <td class="text-ng" style="font-weight: bold;">${grandNG}</td>
                `;
                body.appendChild(totalRow);
            };

            fillTable(trcBody, data.trc || []);
            fillTable(eppiBody, data.eppi || []);
        })
        .catch(err => console.error("Error loading summary tables:", err));
});