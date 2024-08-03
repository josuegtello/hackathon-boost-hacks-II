const d = document;
export function initializeDevices() {
    const $tabs = d.querySelectorAll('.devices-nav li');
    const $tabContents = d.querySelectorAll('.devices-tab');

    function setActiveTab(tabId) {
        $tabContents.forEach(content => {
            content.classList.remove('devices-active');
        });

        $tabs.forEach(tab => tab.classList.remove('devices-active'));

        const activeTab = d.querySelector(`[data-tab="${tabId}"]`);
        const activeContent = d.getElementById(tabId);

        if (activeTab && activeContent) {
            activeTab.classList.add('devices-active');
            activeContent.classList.add('devices-active');
        }
    }

    $tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-tab');
            setActiveTab(target);
        });
    });

    // Activar el primer tab por defecto
    if ($tabs.length > 0) {
        const firstTabId = $tabs[0].getAttribute('data-tab');
        setActiveTab(firstTabId);
    }
}