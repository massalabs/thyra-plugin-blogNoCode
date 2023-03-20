let gWallets = [];
let deployers = [];
let actualTxType = "";
let nextFileToUpload;
let uploadable = false;

// INIT
setMaxSizeLabel();
getWallets();
getWebsiteDeployerSC();
initializeDefaultWallet();

//const eventManager = new EventManager();

async function onSubmitDeploy(txType = "deployWebsiteAndUpload") {
    setTxType(txType);
    callTx();
}

// Write the default wallet text in wallet popover component
async function getWebsiteDeployerSC() {
    let defaultWallet = getDefaultWallet();
    if (defaultWallet === "") {
        //  errorAlert(getErrorMessage("Wallet-5001"));
        return;
    }
}

// Write the default wallet text in wallet popover component
function initializeDefaultWallet() {
    let defaultWallet = getDefaultWallet();
    if (defaultWallet === "") {
        defaultWallet = "Connect";
    }
    $(".popover__title").html(defaultWallet);
}

// Retrieve the default wallet nickname in cookies
function getDefaultWallet() {
    let defaultWallet = "";
    const cookies = document.cookie.split(";");
    cookies.forEach((cookie) => {
        const keyValue = cookie.split("=");
        if (keyValue[0] === "defaultWallet") {
            defaultWallet = keyValue[1];
        }
    });
    return defaultWallet;
}

function getWallet(nickname) {
    return gWallets.find((w) => w.nickname === nickname);
}

function getWallet(nickname) {
    return gWallets.find((w) => w.nickname === nickname);
}

function setTxType(txType) {
    actualTxType = txType;
}

async function callTx() {
    let wallet = getDefaultWallet();
    if (wallet === "") {
        console.log("no wallet");
        return;
    }

    if (actualTxType === "deployWebsiteAndUpload") {
        deployWebsiteAndUpload();
    }
}

// Append wallet accounts in popover component list
async function feedWallet(w) {
    let counter = 0;
    if (w.length != 0) {
        for (const wallet of w) {
            $("#wallet-list").append(
                "<li class='wallet-item'><a class='wallet-link' id='wallet-link-" +
                    counter +
                    "' onclick='changeDefaultWallet(event)' href='#'>" +
                    wallet.nickname +
                    "</a></li>"
            );
            counter++;
        }
        return;
    }
    
    if (w.length == 0) {
        console.log("no wallet");
        $("#wallet-list").append(
            "<li class='wallet-item'><a class='wallet-link' id='wallet-link-1' href='#'>No wallet</a></li>"
        );
    }
}

// Handle popover click & update default wallet in cookies
function changeDefaultWallet(event) {
    const idElementClicked = event.target.id;
    const newDefaultWalletId = idElementClicked.split("-")[2];
    const walletName = gWallets[newDefaultWalletId].nickname;

    document.cookie = "defaultWallet=" + walletName;
    $(".popover__title").html(walletName);

    getWebsiteDeployerSC();
}

async function getWallets() {
    axios
        .get("http://my.massa/mgmt/wallet")
        .then((resp) => {
            if (resp) {
                gWallets = resp.data;
                feedWallet(gWallets);
            }
        })
        .catch((error) => {
            console.error(error);
        });
}

//check if input string is valid
$(".website-dns input").on("change", function () {
    let str = $(".website-dns input").val();
    let pattern = new RegExp("^[a-z0-9]+$");
    let testPattern = pattern.test(str);

    if (testPattern == false) {
        uploadable = false;
        document.getElementsByClassName("dns-error")[0].style.display = "flex";
        document.getElementById("website-upload").style.display = "none";
        document.getElementById("website-upload-refuse").style.display = "flex";
    } else {
        uploadable = true;
        document.getElementsByClassName("dns-error")[0].style.display = "none";
        document.getElementById("website-upload").style.display = "flex";
        document.getElementById("website-upload-refuse").style.display = "none";
    }
});

async function putUpload(bodyFormData) {
    try {
        const response = await axios({
            url: `http://my.massa/websiteCreator/prepare`,
            method: "put",
            data: bodyFormData,
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response;
    } catch (error) {
        console.error(error);
        throw error; // throw the error so it can be caught by the caller
    }
}

// Full deployment process
async function deployWebsiteAndUpload() {
    const dnsNameInputValue = document.getElementById("websiteName").value;

    const file = await createZipFile();
    const bodyFormData = new FormData();
    bodyFormData.append("url", dnsNameInputValue);
    bodyFormData.append("nickname", getDefaultWallet());
    bodyFormData.append("zipfile", file);
    document.getElementById("website-upload").style.display = "none";
    document.getElementById("loader").style.display = "flex";
    await putUpload(bodyFormData);
    document.getElementById("website-upload").style.display = "flex";
    document.getElementById("loader").style.display = "none";
}

function setMaxSizeLabel() {
    const spans = document.getElementsByClassName("UploadMaxSizeLabel");
    for (let span of spans) {
        span.innerHTML = formatBytes(uploadMaxSize);
    }
}

function formatBytes(bytes, decimals = 2, isBinary = false) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]; // or ['B', 'KB', 'MB', 'GB', 'TB']

    if (!+bytes) {
        return `0 ${sizes[0]}`;
    }

    const inByte = isBinary ? 1024 : 1000;
    const dm = decimals < 0 ? 0 : decimals;

    const pow = Math.floor(Math.log(bytes) / Math.log(inByte));
    const maxPow = Math.min(pow, sizes.length - 1);

    return `${parseFloat((bytes / Math.pow(inByte, maxPow)).toFixed(dm))} ${
        sizes[maxPow]
    }`;
}

function openModal() {
    document.getElementById("myModal").style.display = "block";
}

function closeModal() {
    document.getElementById("myModal").style.display = "none";
}

function handleDeploy() {
    onSubmitDeploy();
}

async function createZipFile() {
    let zip = new JSZip();

    const addImport = '<link href="./style.css" rel="stylesheet"/>';

    const htmlContent = editor.getHtml();
    const contentWithImport = addImport + htmlContent;

    zip.file("index.html", contentWithImport);
    zip.file("style.css", editor.getCss());

    const blob = await zip.generateAsync({ type: "blob" });
    const file = new File([blob], "website.zip", { type: "application/zip" });

    return file;
}
