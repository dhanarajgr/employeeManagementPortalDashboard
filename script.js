const API_URL = 'https://6992c21b8f29113acd3ea1c1.mockapi.io/details';

let allEmployees = [];
let filteredEmployees = [];
let currentPage = 1;
const PAGE_SIZE = 10;
let editMode = false;
let editId = null;

const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const deptSort = document.getElementById('deptSort');
const salarySort = document.getElementById('salarySort');
const statusFilter = document.getElementById('statusFilter');

const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

const addBtn = document.getElementById('addBtn');
const exportBtn = document.getElementById('exportBtn');
const printBtn = document.getElementById('printBtn');

const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const formSubmitBtn = document.getElementById('formSubmitBtn');
const employeeForm = document.getElementById('employeeForm');

const empId = document.getElementById('empId');
const empName = document.getElementById('empName');
const empDept = document.getElementById('empDept');
const empSalary = document.getElementById('empSalary');
const empEmail = document.getElementById('empEmail');
const empStatus = document.getElementById('empStatus');

const totalEmp = document.getElementById('totalEmp');
const activeEmp = document.getElementById('activeEmp');
const inactiveEmp = document.getElementById('inactiveEmp');
const totalSalary = document.getElementById('totalSalary');

// 3. HELPER FUNCTIONS
function formatStatus(value) {
    if (value === true ) return 'Active';
    if (value === false ) return 'Inactive';
    return 'Inactive';
}

function getStatusClass(status) {
    return status === 'Active' ? 'status-active' : 'status-inactive'; //CSS Styling
}

// 4. API OPERATIONS
async function fetchEmployees() {
    try {
        const res = await fetch(API_URL);
        allEmployees = await res.json();
        allEmployees.sort((a, b) => (a.id || 0) - (b.id || 0));
        applyFiltersAndRender();
    } catch (err) {
        console.error('Fetch error:', err);
        alert('Failed to fetch employees. Please refresh.');
    }
}

async function addEmployee(data) {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            await fetchEmployees();
            return true;
        }
    } catch (err) {
        console.error('Add error:', err);
    }
    return false;
}

async function updateEmployee(id, data) {
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            await fetchEmployees();
            return true;
        }
    } catch (err) {
        console.error('Update error:', err);
    }
    return false;
}

async function deleteEmployee(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            await fetchEmployees();
            return true;
        }
    } catch (err) {
        console.error('Delete error:', err);
    }
    return false;
}

// 5. FILTERING, SORTING & PAGINATION
function applyFiltersAndRender() {
    let data = [...allEmployees];

    // Search
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        data = data.filter(emp =>
            (emp.id && emp.id.toString().includes(searchTerm)) ||
            (emp.name && emp.name.toLowerCase().includes(searchTerm)) ||
            (emp.departnment && emp.departnment.toLowerCase().includes(searchTerm)) ||
            (emp.email && emp.email.toLowerCase().includes(searchTerm))
        );
    }

    // Status filter
    const statusValue = statusFilter.value;
    if (statusValue !== 'all') {
        const boolStatus = statusValue === 'true';
        data = data.filter(emp => emp.status === boolStatus);
    }

    // Department sort
    const dept = deptSort.value;
    if (dept === 'asc') {
        data.sort((a, b) => (a.departnment || '').localeCompare(b.departnment || ''));
    } else if (dept === 'desc') {
        data.sort((a, b) => (b.departnment || '').localeCompare(a.departnment || ''));
    }

    // Salary sort
    const sal = salarySort.value;
    if (sal === 'low') {
        data.sort((a, b) => (parseFloat(a.salary) || 0) - (parseFloat(b.salary) || 0));
    } else if (sal === 'high') {
        data.sort((a, b) => (parseFloat(b.salary) || 0) - (parseFloat(a.salary) || 0));
    }

    filteredEmployees = data;
    currentPage = 1;
    renderTable();
    updateStats();
}

function renderTable() {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageData = filteredEmployees.slice(start, end);

    if (pageData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#888;">No employees found</td></tr>`;
    } else {
        let html = '';
        pageData.forEach(emp => {
            const statusDisplay = formatStatus(emp.status);
            const statusClass = getStatusClass(statusDisplay);
            html += `
                <tr>
                    <td>${emp.id || '-'}</td>
                    <td>${emp.name || '-'}</td>
                    <td>${emp.departnment || '-'}</td>
                    <td>₹${emp.salary || 0}</td>
                    <td>${emp.email || '-'}</td>
                    <td><span class="status-badge ${statusClass}">${statusDisplay}</span></td>
                    <td>
                        <button class="edit-btn" data-id="${emp.id}">✏️</button>
                        <button class="delete-btn" data-id="${emp.id}">🗑️</button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    }

    // Update pagination info
    const totalPages = Math.ceil(filteredEmployees.length / PAGE_SIZE) || 1;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    // Attach event listeners to edit/delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => handleDelete(btn.dataset.id));
    });
}

function updateStats() {
    const total = filteredEmployees.length;
    const active = filteredEmployees.filter(e => e.status === true || e.status === 'true').length;
    const inactive = filteredEmployees.filter(e => e.status === false || e.status === 'false').length;
    const totalSal = filteredEmployees.reduce((sum, e) => sum + (parseFloat(e.salary) || 0), 0);

    totalEmp.textContent = total;
    activeEmp.textContent = active;
    inactiveEmp.textContent = inactive;
    totalSalary.textContent = '₹' + totalSal.toLocaleString();
}

// 6. CRUD - ADD / EDIT
function openAddModal() {
    editMode = false;
    editId = null;
    modalTitle.textContent = 'Add Employee';
    formSubmitBtn.textContent = 'Add Employee';
    employeeForm.reset();
    modal.style.display = 'flex';
    // Auto-generate ID
    const maxId = allEmployees.reduce((max, e) => Math.max(max, parseInt(e.id) || 0), 0);
    empId.value = maxId + 1;
    empId.readOnly = true;
}

function openEditModal(id) {
    const emp = allEmployees.find(e => e.id == id);
    if (!emp) return;
    editMode = true;
    editId = id;
    modalTitle.textContent = 'Edit Employee';
    formSubmitBtn.textContent = 'Update Employee';
    empId.value = emp.id;
    empId.readOnly = true;
    empName.value = emp.name || '';
    empDept.value = emp.departnment || '';
    empSalary.value = emp.salary || '';
    empEmail.value = emp.email || '';
    empStatus.value = emp.status === true ? 'true' : 'false';
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    employeeForm.reset();
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const id = empId.value.trim();
    const name = empName.value.trim();
    const dept = empDept.value.trim();
    const salary = empSalary.value.trim();
    const email = empEmail.value.trim();
    const status = empStatus.value;

    if (!id || !name || !dept || !salary || !email || !status) {
        alert('Please fill all fields');
        return;
    }

    if (isNaN(salary) || parseFloat(salary) <= 0) {
        alert('Please enter a valid salary');
        return;
    }

    if (!email.includes('@') || !email.includes('.')) {
        alert('Please enter a valid email');
        return;
    }

    const statusBool = status === 'true';

    const data = {
        id: id,
        name: name,
        departnment: dept,
        salary: salary,
        email: email,
        status: statusBool
    };

    let success = false;
    if (editMode) {
        success = await updateEmployee(editId, data);
    } else {
        success = await addEmployee(data);
    }

    if (success) {
        closeModal();
    } else {
        alert('Operation failed. Please try again.');
    }
}

async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    const success = await deleteEmployee(id);
    if (!success) {
        alert('Delete failed. Please try again.');
    }
}

// 7. EXPORT CSV
function exportCSV() {
    if (filteredEmployees.length === 0) {
        alert('No data to export');
        return;
    }

    let csv = 'ID,Name,Department,Salary,Email,Status\n';
    filteredEmployees.forEach(emp => {
        const statusDisplay = formatStatus(emp.status);
        csv += `${emp.id || ''},${emp.name || ''},${emp.departnment || ''},${emp.salary || 0},${emp.email || ''},${statusDisplay}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 8. PRINT
function printTable() {
    const printContent = document.getElementById('employeeTable').outerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
        <html>
            <head><title>Employees</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                th { background: #f5f5f5; }
                h2 { text-align: center; margin-bottom: 20px; }
            </style>
            </head>
            <body>
                <h2>Employee List</h2>
                ${printContent}
                <p style="margin-top:20px;color:#888;font-size:12px;">Printed on: ${new Date().toLocaleString()}</p>
            </body>
        </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
}

// 9. PAGINATION CONTROLS
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredEmployees.length / PAGE_SIZE);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}

// 10. EVENT LISTENERS

// Search (debounced)
let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFiltersAndRender, 300);
});

// Sort & Filter
deptSort.addEventListener('change', applyFiltersAndRender);
salarySort.addEventListener('change', applyFiltersAndRender);
statusFilter.addEventListener('change', applyFiltersAndRender);

// Pagination
prevBtn.addEventListener('click', prevPage);
nextBtn.addEventListener('click', nextPage);

// Add Employee
addBtn.addEventListener('click', openAddModal);

// Export CSV
exportBtn.addEventListener('click', exportCSV);

// Print
printBtn.addEventListener('click', printTable);

// Modal
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Form Submit
employeeForm.addEventListener('submit', handleFormSubmit);

// 11. INIT - Load Employees on Page Load
fetchEmployees();