if (!localStorage.getItem('firstInstall') || localStorage.getItem('firstInstall') == 0) {
    localStorage.clear();
    sessionStorage.clear();
}