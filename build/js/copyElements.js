document.addEventListener("DOMContentLoaded", function () {

    // data-copy - Так мы инициализируем все элементы, которые хотим скопировать
    // data-where-copy-id - Указываем, куда хотим скопировать элемент по id
    // data-paste-container-id - Контейнер, куда будет копироваться наш элемент
    // data-sort - Сортировка для определения порядка

    if (!document.querySelector('[data-copy]')) {
        return;
    }

    const copyElements = document.querySelectorAll('[data-copy]');

    // Собираем все элементы в массив для сортировки
    const elementsToProcess = Array.from(copyElements).map(el => {
        const sortAttr = el.getAttribute('data-sort');
        const sortValue = sortAttr ? parseInt(sortAttr, 10) : Infinity; // Если нет — ставим Infinity
        return {
            element: el,
            sort: sortValue,
            targets: (el.getAttribute('data-where-copy-id') || '').split(',').map(id => id.trim())
        };
    });

    // Сортируем: сначала по data-sort (по возрастанию), потом без сортировки
    elementsToProcess.sort((a, b) => a.sort - b.sort);

    // Обрабатываем каждый элемент в отсортированном порядке
    elementsToProcess.forEach(item => {
        const originalElement = item.element;
        const targetIds = item.targets;

        targetIds.forEach(targetId => {
            const targetContainers = document.querySelectorAll(`[data-paste-container-id="${targetId}"]`);

            if (!targetContainers.length) {
                console.error(`[COPY ERROR] Контейнер с data-paste-container-id="${targetId}" не найден для элемента:`, originalElement);
                return;
            }

            targetContainers.forEach(targetContainer => {
                // Клонируем элемент (без data-* атрибутов копирования, чтобы избежать рекурсии)
                const clone = originalElement.cloneNode(true);

                // Опционально: удаляем атрибуты копирования у клона, чтобы он не участвовал в будущих копированиях
                clone.removeAttribute('data-copy');
                clone.removeAttribute('data-where-copy-id');
                clone.removeAttribute('data-sort');

                // Добавляем клон в каждый подходящий контейнер
                targetContainer.appendChild(clone);
            });
        });
    });

    if (document.getElementById('isAdmin')) {
        console.log('copyElements.js finish work');
    }
})