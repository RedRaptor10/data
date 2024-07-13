const cache = {
	'movies': null,
	'tv-shows': null
};

document.addEventListener('DOMContentLoaded', () => {
	addNavigationEvents();
	addSearchEvent();
	addSortEvents();
});

function addNavigationEvents() {
	const items = document.querySelectorAll('nav > div > *');

	items.forEach(x => {
		x.addEventListener('click', async () => {
			const filename = x.id;
			const path = './' + filename + '.json';
			const data = cache[filename] != null ? cache[filename] : await getData(path, filename);

			if (!data) {
				// Reset
				document.querySelector('.data-table > div:last-child').innerHTML = '';
				document.querySelector('.data-info').innerHTML = '';
				items.forEach(y => y.classList.remove('active'));
				return;
			}

			addData(data);

			items.forEach(y => y.classList.remove('active'));
			x.classList.add('active');
		});
	});
}

function addSearchEvent() {
	const search = document.querySelector('.data-search > input');

	search.addEventListener('keyup', () => {
		searchData(search);
	});
}

function addSortEvents() {
	const table = document.querySelector('.data-table');
	const headers = table.querySelectorAll('div:first-child > div');

	headers.forEach((header, i) => {
		header.addEventListener('click', () => {
			let currentSortOrder = null;
			const sortActive = header.querySelector('.sort-active');

			if (sortActive) {
				if (sortActive.classList.contains('sort-up')) {
					currentSortOrder = 'asc';
				} else if (sortActive.classList.contains('sort-down')) {
					currentSortOrder = 'desc';
				}
			}
			
			const targetSortOrder = currentSortOrder == null || currentSortOrder == 'desc' ? 'asc' : 'desc';

			sortData(header, i, targetSortOrder);
		});
	});
}

function searchData(searchInput) {
	const value = searchInput.value.toUpperCase();
	const cells = document.querySelectorAll('.data-table > div:last-child > div > div:first-child');

	cells.forEach(c => {
		const text = c.innerHTML.toUpperCase();

		if (text.indexOf(value) > -1) {
			c.parentNode.classList.remove('hidden-important');
		} else {
			c.parentNode.classList.add('hidden-important');
		}
	});
}

function sortData(header, index, sortOrder) {
	const items = document.querySelectorAll('.data-table > div:last-child > div > div:nth-child(' + (index + 1) + ')');
	const itemsArray = Array.from(items);

	switch (index) {
		// Name
		case 0:
			itemsArray.sort(function(a, b) {
				let result;

				if (sortOrder == 'asc') {
					result = a.innerHTML.toUpperCase().localeCompare(b.innerHTML.toUpperCase());
				} else if (sortOrder == 'desc') {
					result = b.innerHTML.toUpperCase().localeCompare(a.innerHTML.toUpperCase());
				}

				return result;
			});

			break;
		// Date
		case 1:
			itemsArray.sort(function(a, b) {
				const dateA = new Date(a.innerHTML);
				const dateB = new Date(b.innerHTML);

				if (dateA.getTime() == dateB.getTime()) {
					return 0;
				} else if (sortOrder == 'asc') {
					if (dateA.getTime() < dateB.getTime()) {
						return -1;
					} else if (dateA.getTime() > dateB.getTime()) {
						return 1;
					}
				} else if (sortOrder == 'desc') {
					if (dateA.getTime() < dateB.getTime()) {
						return 1;
					} else if (dateA.getTime() < dateB.getTime()) {
						return 1;
					}
				}
			});

			break;
		// Size
		case 2:
			itemsArray.sort(function(a, b) {
				const sizeA = parseInt(a.dataset.size);
				const sizeB = parseInt(b.dataset.size);

				if (sortOrder == 'asc') {
					if (sizeA < sizeB) {
						return -1;
					} else if (sizeA == sizeB) {
						return 0;
					} else if (sizeA > sizeB) {
						return 1;
					}
				} else if (sortOrder == 'desc') {
					if (sizeB < sizeA) {
						return -1;
					} else if (sizeB == sizeA) {
						return 0;
					} else if (sizeB > sizeA) {
						return 1;
					}
				}
			});

			break;
		default:
			break;
	}

	for (let i = 0; i < itemsArray.length; i++) {
		itemsArray[i].parentNode.parentNode.appendChild(itemsArray[i].parentNode);
	}

	// Set Active Sort Arrow
	const sortArrows = document.querySelectorAll('.sort-arrow');
	const targetSortArrow = sortOrder == 'asc' ? header.querySelector('.sort-up') : header.querySelector('.sort-down');

	sortArrows.forEach(x => {
		x.classList.remove('sort-active');
	});

	targetSortArrow.classList.add('sort-active');
}

async function getData(resource, filename) {
	try {
		const response = await fetch(resource);
		if (!response.ok) throw new Error();

		const result = await response.json();

		// Save to cache
		cache[filename] = result;

		return result;
	} catch (error) {
		return false;
	}
}

function addData(data) {
	const target = document.querySelector('.data-table > div:last-child');
	var totalSize = 0;

	// Clear Table
	target.innerHTML = '';

	data.forEach(d => {
		if (!d.is_folder) return; // Continue

		const row = document.createElement('div');
		const col1 = document.createElement('div');
		const col2 = document.createElement('div');
		const col3 = document.createElement('div');

		const name = d.filename.split('\\').pop();
		const size = formatBytes(d.size, 0);

		const date_unix = (d.date_modified / 10000000) - 11644473600; // Convert FILETIME to UNIXTIME ("Everything" by voidtools uses FILETIME)
		const date = new Date(date_unix * 1000); // Convert unix to ms
		const dateModified = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

		col1.innerHTML = name;
		col2.innerHTML = dateModified;
		col3.innerHTML = size;
		col3.dataset.size = d.size;

		row.append(col1, col2, col3);
		target.append(row);

		// Update Total Size
		totalSize += d.size;
	});

	// Update Info
	document.querySelector('.data-info').innerHTML = 'Total: ' + data.length + ' &#x2022; ' + formatBytes(totalSize, 0);
}

function formatBytes(bytes, decimals = 2) {
	if (!+bytes) return '0 B';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
