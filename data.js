const cache = {
	'movies': null,
	'tv-shows': null
};

document.addEventListener('DOMContentLoaded', () => {
	addEvents();
});

function addEvents() {
	const items = document.querySelectorAll('nav > *');

	items.forEach(x => {
		x.addEventListener('click', async () => {
			const filename = x.id;
			const path = './' + filename + '.json';
			const data = cache[filename] != null ? cache[filename] : await getData(path, filename);

			if (!data) {
				// Reset
				document.querySelector('.data-table > div:last-child').innerHTML = '';
				document.querySelector('.data-count').innerHTML = '';
				items.forEach(y => y.classList.remove('active'));
				return;
			}

			addData(data);

			items.forEach(y => y.classList.remove('active'));
			x.classList.add('active');
		});
	});
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

	// Clear Table
	target.innerHTML = '';
	
	// Update Count
	document.querySelector('.data-count').innerHTML = 'Total: ' + data.length;

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

		row.append(col1, col2, col3);
		target.append(row);
	});
}

function formatBytes(bytes, decimals = 2) {
	if (!+bytes) return '0 B';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}