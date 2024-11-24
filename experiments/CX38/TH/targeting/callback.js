function callback() {
    optimizely.utils.waitForElement(`selector`)
    .then(elem => {
        activate();
    });
}