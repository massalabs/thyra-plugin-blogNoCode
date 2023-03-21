let gWallets = [];
let deployers = [];
let actualTxType = "";
let nextFileToUpload;
let uploadable = false;

// INIT
setMaxSizeLabel();
feedWallet();
getWebsiteDeployerSC();
initializeDefaultWallet();

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

// get the address of a wallet nickname
function getAddressByNickname(wallets, nickname) {
    for (let i = 0; i < wallets.length; i++) {
        if (wallets[i].nickname === nickname) {
            return wallets[i].address;
        }
    }
    return null; // Return null if the nickname is not found
}

//get the balance of an Address
async function getBalanceOf(address) {
    const options = {
        method: "GET",
        url: `http://my.massa/massa/addresses?addresses=${address}`,
        mode: "no-cors",
        headers: {
            "Content-Type": "application/json",
        },
        data: {},
        withCredentials: false,
    };

    try {
        const response = await axios.request(options);
        return response.data.addressesAttributes;
    } catch (error) {
        console.error(error);
    }
}

async function getBalanceOfNickname(nickname) {
    const wallets = await getWallets();

    const walletAddress = await getAddressByNickname(wallets, nickname);

    const balanceObj = await getBalanceOf(walletAddress);

    const balanceArr = Object.values(balanceObj);

    const balance = Math.round(parseFloat(balanceArr[0].balance.pending));

    return balance;
}

async function isEnoughBalance() {
    const defaultWallet = getDefaultWallet();
    const balance = await getBalanceOfNickname(defaultWallet);
    if (balance < 100) {
        document.getElementById("balance-error").style.display = "flex";

        return false;
    }
    document.getElementById("balance-error").style.display = "none";
    return true;
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

    const isEnoughMassa = await isEnoughBalance();

    if (isEnoughMassa === false) {
        console.log("not enough massa");
        return;
    }

    if (wallet === "") {
        console.log("no wallet");
        return;
    }
    if (uploadable === false) {
        console.log("wrong dns name");
        return;
    }

    if (actualTxType === "deployWebsiteAndUpload") {
        deployWebsiteAndUpload();
    }
}

// Append wallet accounts in popover component list
async function feedWallet() {
    const w = await getWallets();
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
        document.getElementById("create-wallet").style.display = "none";
        return;
    }

    if (w.length == 0) {
        console.log("no wallet");
        $("#wallet-list").append(
            "<li class='wallet-item'><a class='wallet-link' id='wallet-link-1' href='#'>No wallet</a></li>"
        );
        document.getElementById("create-wallet").style.display = "flex";
    }
}

// Handle popover click & update default wallet in cookies
async function changeDefaultWallet(event) {
    gWallets = await getWallets();
    const idElementClicked = event.target.id;
    const newDefaultWalletId = idElementClicked.split("-")[2];
    const walletName = gWallets[newDefaultWalletId].nickname;
    document.cookie = "defaultWallet=" + walletName;
    $(".popover__title").html(walletName);

    getWebsiteDeployerSC();
}

async function getWallets() {
    try {
        const resp = await axios.get("http://my.massa/mgmt/wallet");
        if (resp) {
            const gWallets = resp.data;
            return gWallets;
        }
    } catch (error) {
        console.error(error);
    }
}

//check if input string is valid
$("#websiteName").on("change", function () {
    let str = $(".website-dns input").val();
    let pattern = new RegExp("^[a-z0-9]+$");
    let testPattern = pattern.test(str);
    if (testPattern == false) {
        uploadable = false;
        document.getElementById("dns-error").style.display = "flex";
    } else {
        uploadable = true;
        document.getElementById("dns-error").style.display = "none";
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
