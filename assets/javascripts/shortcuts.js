// 留个 flag
keyboard$.subscribe(function (key) {
    if (key.mode === "global" && key.type === "#") {
        window.alert("恭喜解锁一个 flag: NE30104");
        key.claim();
    }
})

// Vim 按键绑定
// issues: ud 按键不能正常使用
keyboard$.subscribe(function (key) {
    if (key.mode === "global" && key.type === "j") {
        window.scrollBy({
            top: 100,
            behavior: "smooth"
        });
        key.claim();
    }
    if (key.mode === "global" && key.type === "k") {
        window.scrollBy({
            top: -100,
            behavior: "smooth"
        });
        key.claim();
    }
    if (key.mode === "global" && key.type === "h") {
        window.scrollBy({
            left: 100,
            behavior: "smooth"
        });
        key.claim();
    }
    if (key.mode === "global" && key.type === "l") {
        window.scrollBy({
            left: -100,
            behavior: "smooth"
        });
        key.claim();
    }
    // if (key.mode === "global" && key.type === "u") {
    //     window.scrollByPages(-1);
    //     key.claim();
    // }
    // if (key.mode === "global" && key.type === "d") {
    //     window.scrollByPages(1);
    //     key.claim();
    // }
    if (key.mode === "global" && key.type === "g") {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
        key.claim();
    }
    if (key.mode === "global" && key.type === "G") {
        window.scrollTo({
            top: 9999,
            behavior: "smooth"
        });
        key.claim();
    }
    if (key.mode === "global" && key.type === "r") {
        location.reload();
        key.claim();
    }
})
