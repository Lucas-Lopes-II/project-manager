// jsdom has no layout, and the router scrolls to the top on each navigation.
window.scrollTo = () => {}
