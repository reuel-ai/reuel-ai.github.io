async function loadPartial(id, file) {
    const element = document.getElementById(id)

    if (!element) return

    try {
        const response = await fetch(file)

        if (!response.ok)
            throw new Error(response.status)

        element.innerHTML = await response.text()
    } catch (err) {
        console.error(`Couldn't load ${file}`, err)
    }
}

document.addEventListener("DOMContentLoaded", async () => {

    await Promise.all([
        loadPartial("header", "partials/header.html"),
        loadPartial("footer", "partials/footer.html")
    ])

    document.dispatchEvent(
        new Event("partialsLoaded")
    )

})