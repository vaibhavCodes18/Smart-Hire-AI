document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const analyzeBtn = document.getElementById('analyze-btn');
    const jobDescriptionInput = document.getElementById('job-description');
    const clearJdBtn = document.getElementById('clear-jd');
    
    // Results DOM
    const resultsEmpty = document.getElementById('results-empty');
    const resultsLoading = document.getElementById('results-loading');
    const resultsList = document.getElementById('results-list');
    const errorMsg = document.getElementById('error-msg');
    const errorText = document.getElementById('error-text');
    
    // Stats and Controls
    const statsContainer = document.getElementById('stats-container');
    const statTotal = document.getElementById('stat-total');
    const statTop = document.getElementById('stat-top');
    const filterContainer = document.getElementById('filter-container');
    const categoryFilter = document.getElementById('category-filter');
    const sortContainer = document.getElementById('sort-container');
    const sortSelect = document.getElementById('sort-select');
    const downloadCsvBtn = document.getElementById('download-csv-btn');

    // State
    let uploadedFiles = new Map(); // using Map to keep track of unique files by name
    let analysisResults = [];

    // --- File Upload Logic ---
    
    // Click to upload
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-active');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-active');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
        // Reset input so same file can be selected again if removed
        this.value = null; 
    });

    function handleFiles(files) {
        const fileArr = Array.from(files);
        
        fileArr.forEach(file => {
            if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
                // Add to our state
                uploadedFiles.set(file.name, file);
            } else {
                showTemporaryError(`File ${file.name} is not a PDF.`);
            }
        });
        
        renderFileList();
        updateAnalyzeButtonState();
    }

    function removeFile(fileName) {
        uploadedFiles.delete(fileName);
        renderFileList();
        updateAnalyzeButtonState();
    }

    function renderFileList() {
        fileList.innerHTML = '';
        
        if (uploadedFiles.size === 0) {
            return;
        }

        uploadedFiles.forEach((file, fileName) => {
            const fileSize = (file.size / 1024 / 1024).toFixed(2); // MB
            
            const fileItem = document.createElement('div');
            fileItem.className = 'flex items-center justify-between p-3 bg-black/20 border border-slate-700/50 rounded-xl group transition-all hover:bg-slate-800/50';
            
            fileItem.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-file-pdf text-red-400"></i>
                    </div>
                    <div class="overflow-hidden min-w-0">
                        <p class="text-sm font-medium text-slate-200 truncate">${fileName}</p>
                        <p class="text-xs text-slate-500">${fileSize} MB</p>
                    </div>
                </div>
                <button type="button" class="text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg w-8 h-8 flex items-center justify-center transition-all" title="Remove file">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;

            // Add event listener to the remove button
            fileItem.querySelector('button').addEventListener('click', (e) => {
                e.stopPropagation(); // prevent triggering dropzone click
                removeFile(fileName);
            });

            fileList.appendChild(fileItem);
        });
    }

    // --- Input Logic ---
    
    clearJdBtn.addEventListener('click', (e) => {
        e.preventDefault();
        jobDescriptionInput.value = '';
        updateAnalyzeButtonState();
    });

    jobDescriptionInput.addEventListener('input', updateAnalyzeButtonState);

    function updateAnalyzeButtonState() {
        const hasText = jobDescriptionInput.value.trim().length > 0;
        const hasFiles = uploadedFiles.size > 0;
        
        analyzeBtn.disabled = !(hasText && hasFiles);
    }

    function showTemporaryError(msg) {
        errorText.textContent = msg;
        errorMsg.classList.remove('hidden');
        setTimeout(() => {
            errorMsg.classList.add('hidden');
        }, 5000);
    }

    // --- Backend API Call ---
    
    analyzeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (uploadedFiles.size === 0 || jobDescriptionInput.value.trim() === '') return;

        // UI Updates for loading
        errorMsg.classList.add('hidden');
        resultsEmpty.classList.add('hidden');
        resultsList.classList.add('hidden');
        statsContainer.classList.add('hidden');
        filterContainer.classList.add('hidden');
        sortContainer.classList.add('hidden');
        downloadCsvBtn.classList.add('hidden');
        
        resultsLoading.classList.remove('hidden');
        
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';

        const formData = new FormData();
        formData.append('job_description', jobDescriptionInput.value.trim());
        
        uploadedFiles.forEach(file => {
            formData.append('resumes', file);
        });

        try {
            // Adjust port to match your backend (e.g., 8000 for FastAPI, 5000 for Flask, 8080 for Spring)
            const response = await fetch('http://localhost:8000/api/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }

            const data = await response.json();
            
            analysisResults = processBackendData(data);
            
            // Render results
            renderResults();
            updateStats();
            populateFilters();
            
            // Show UI
            resultsLoading.classList.add('hidden');
            resultsList.classList.remove('hidden');
            statsContainer.classList.remove('hidden');
            filterContainer.classList.remove('hidden');
            sortContainer.classList.remove('hidden');
            downloadCsvBtn.classList.remove('hidden');

        } catch (error) {
            console.error('Error calling backend API:', error);
            
            resultsLoading.classList.add('hidden');
            resultsEmpty.classList.remove('hidden');
            
            showTemporaryError('Failed to connect to backend API. Please ensure the backend is running at http://localhost:8000/api/analyze');
            
            // NOTE: For demonstration purposes if backend is down, you can uncomment this block:
            /*
            setTimeout(() => {
                analysisResults = processBackendData([
                    { category: "Python Developer", score: 0.89, filename: "john_doe_resume.pdf" },
                    { category: "Data Scientist", score: 0.75, filename: "jane_smith_cv.pdf" },
                    { category: "Frontend Dev", score: 0.42, filename: "alex_jones.pdf" }
                ]);
                renderResults(); updateStats(); populateFilters();
                resultsLoading.classList.add('hidden'); resultsList.classList.remove('hidden');
                statsContainer.classList.remove('hidden'); filterContainer.classList.remove('hidden');
                sortContainer.classList.remove('hidden'); downloadCsvBtn.classList.remove('hidden');
            }, 1500);
            */
        } finally {
            analyzeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Analyze Resumes';
            updateAnalyzeButtonState();
        }
    });

    // Helper to format data uniformly
    function processBackendData(data) {
        // Handle variations in backend response formatting
        let formatted = Array.isArray(data) ? data : (data.results || data.matches || []);
        
        return formatted.map((item, index) => {
            // Handle score scales (0-1 vs 0-100)
            let rawScore = item.score !== undefined ? item.score : (item.similarity !== undefined ? item.similarity : 0);
            let percentage = rawScore <= 1.0 ? rawScore * 100 : rawScore;
            
            // Sometimes it's passed as a string like "89%"
            if (typeof rawScore === 'string' && rawScore.includes('%')) {
                percentage = parseFloat(rawScore.replace('%', ''));
            }
            
            return {
                id: index,
                filename: item.filename || item.file_name || item.name || `Candidate_${index + 1}.pdf`,
                category: item.category || item.predicted_role || 'General',
                score: percentage
            };
        });
    }

    // --- Results Rendering ---

    function getScoreColor(score) {
        if (score >= 80) return { text: 'text-emerald-400', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
        if (score >= 60) return { text: 'text-amber-400', bg: 'bg-amber-500', bgLight: 'bg-amber-500/10', border: 'border-amber-500/20' };
        return { text: 'text-rose-400', bg: 'bg-rose-500', bgLight: 'bg-rose-500/10', border: 'border-rose-500/20' };
    }

    function renderResults() {
        resultsList.innerHTML = '';
        
        // Apply sorting
        const sortValue = sortSelect.value;
        let sorted = [...analysisResults];
        
        if (sortValue === 'score-desc') {
            sorted.sort((a, b) => b.score - a.score);
        } else if (sortValue === 'score-asc') {
            sorted.sort((a, b) => a.score - b.score);
        }

        // Apply filtering
        const filterValue = categoryFilter.value;
        if (filterValue !== 'all') {
            sorted = sorted.filter(item => item.category === filterValue);
        }

        if (sorted.length === 0) {
            resultsList.innerHTML = `
                <div class="text-center py-10">
                    <p class="text-slate-500">No candidates match the selected filters.</p>
                </div>
            `;
            return;
        }

        sorted.forEach((result, index) => {
            const colors = getScoreColor(result.score);
            const scoreFormatted = result.score.toFixed(1) + '%';
            
            // Rank badge - Top 3 get special styling
            let rankBadge = '';
            if (index === 0 && sortValue === 'score-desc' && filterValue === 'all') {
                rankBadge = '<div class="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900 rounded-full flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.5)] border-2 border-slate-900" title="Top Match"><i class="fa-solid fa-crown text-xs"></i></div>';
            } else {
                rankBadge = `<div class="absolute top-4 right-4 text-sm font-bold text-slate-600">#${index + 1}</div>`;
            }

            const card = document.createElement('div');
            card.className = `relative bg-black/20 rounded-2xl border border-slate-700/50 p-5 shadow-lg hover:shadow-indigo-500/5 transition-all group hover:bg-white/[0.02]`;
            
            card.innerHTML = `
                ${rankBadge}
                <div class="flex items-start gap-4 mb-5">
                    <div class="w-12 h-12 rounded-xl ${colors.bgLight} ${colors.border} border flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-user-astronaut ${colors.text} text-xl"></i>
                    </div>
                    <div class="flex-grow pr-4 sm:pr-8 min-w-0">
                        <h3 class="text-lg font-heading font-semibold text-white truncate" title="${result.filename}">${result.filename}</h3>
                        <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mt-1 whitespace-normal break-words line-clamp-1">
                            ${result.category}
                        </span>
                    </div>
                </div>
                
                <div>
                    <div class="flex justify-between items-end mb-2">
                        <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Semantic Match</span>
                        <span class="text-xl font-heading font-bold ${colors.text} drop-shadow-md">${scoreFormatted}</span>
                    </div>
                    <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
                        <div class="${colors.bg} h-2 rounded-full transition-all duration-1000 ease-out relative overflow-hidden" style="width: 0%">
                            <div class="absolute inset-0 bg-white/20 w-full h-full" style="animation: shimmer 2s infinite"></div>
                        </div>
                    </div>
                </div>
            `;

            resultsList.appendChild(card);

            // Animate progress bar after small delay
            setTimeout(() => {
                const progressBar = card.querySelector('.transition-all');
                if (progressBar) {
                    progressBar.style.width = `${result.score}%`;
                }
            }, 50);
        });
    }

    function updateStats() {
        statTotal.textContent = analysisResults.length;
        
        if (analysisResults.length > 0) {
            const maxScore = Math.max(...analysisResults.map(r => r.score));
            statTop.textContent = maxScore.toFixed(1) + '%';
        } else {
            statTop.textContent = '0%';
        }
    }

    function populateFilters() {
        // Extract unique categories
        const categories = [...new Set(analysisResults.map(r => r.category))];
        
        // Preserve current selection if possible
        const currentVal = categoryFilter.value;
        
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });
        
        // Restore selection or default to all
        if (categories.includes(currentVal)) {
            categoryFilter.value = currentVal;
        }
    }

    // Controls Event Listeners
    categoryFilter.addEventListener('change', renderResults);
    sortSelect.addEventListener('change', renderResults);

    // CSV Download
    downloadCsvBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (analysisResults.length === 0) return;

        // Sort by highest score for the export
        const exportData = [...analysisResults].sort((a, b) => b.score - a.score);
        
        const headers = ['Rank', 'Filename', 'Category', 'Match Score (%)'];
        const csvRows = [headers.join(',')];
        
        exportData.forEach((item, index) => {
            const row = [
                index + 1,
                `"${item.filename.replace(/"/g, '""')}"`, // escape quotes
                `"${item.category.replace(/"/g, '""')}"`,
                item.score.toFixed(2)
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'resume_analysis_results.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Initialize state
    updateAnalyzeButtonState();
});
