
function showLoad(text){
    const loadingComp = document.querySelector("#loading-comp-name");
    loadingComp.innerHTML = text;
    loadingComp.style.display = "block";
}

function hideLoad(){
    const loadingComp = document.querySelector("#loading-comp-name");
    loadingComp.style.display = "none";
}

function replaceNewlines(date) {
    if (!(date instanceof Date)) {
        return date
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月は0から始まるので+1
    const day = String(date.getDate()).padStart(2, '0');        // 日を2桁に補正

    return `${year}-${month}-${day}`;
}

function delAll(){
    const inputDatas = document.querySelectorAll("input")
    for(inp of inputDatas){
        inp.value = "";
    }
    document.querySelector("#notes").value = "";
}


function disableInput(){
    const inputs = document.querySelectorAll("input");
    const buttons = document.querySelectorAll("button");
    const area = document.querySelector("textarea");
    for(input of inputs){
        input.disabled = true;
    }
    for(btn of buttons){
        btn.disabled = true;
    }
    area.disabled = true;
}

function enableSearch(){
    document.querySelector("#customerName").disabled = false;
    document.querySelector("#searchCompanyName").disabled = false;
}

function enableInput(){
    const inputs = document.querySelectorAll("input");
    const buttons = document.querySelectorAll("button");
    const area = document.querySelector("textarea");
    for(input of inputs){
        input.disabled = false;
    }
    for(btn of buttons){
        btn.disabled = false;
    }
    area.disabled = false;
}

async function getData(){
    const mainDB = document.querySelector("#customerList");
    showLoad("顧客情報の一覧を取得中・・・")
    disableInput();

    try{
        const customer_names = await fetch("https://eijicustomermanagement.onrender.com/getcompnames");
        const ret = await customer_names.json();
        console.log(ret);
        document.querySelector("#customerList").innerHTML = "";
        for(let i=1; i<ret.length; i++){
            let op = document.createElement("option");
            op.setAttribute("value", ret[i])
            mainDB.appendChild(op);
            sessionStorage.setItem(ret[i], i+2)
        }
        hideLoad();
        enableSearch();
    }catch{
        console.log("ERROR: cannot fetch the usernames")
        showLoad("読み込みに失敗しました。画面を更新してみてください。")
        enableSearch();
    }

}

async function getCustomerDatas() {
    const customerName = document.querySelector("#customerName").value;
    console.log("Customer Name:", customerName);

    showLoad("顧客の個別情報を取得中・・・");
    disableInput();

    delAll();
    document.querySelector("#customerName").value = customerName;
    try{
        const encordedData = encodeURIComponent(customerName)
        const customer_datas = await fetch(`https://eijicustomermanagement.onrender.com/getcompdata?compName=${encordedData}`);
        const ret = await customer_datas.json();
        console.log(ret)
        const keys = Object.keys(ret);
        const vals = Object.values(ret);
        for(let i = 0; i<=keys.length; i++){
            let key = keys[i];
            let val = vals[i];
            console.log("key:" + key);
            console.log("val:" + val);
            try{
                document.querySelector(`#${key}`).value = replaceNewlines(val)
            }catch{

            }
        }
        hideLoad();
        enableInput();
    }catch{
        showLoad("対象の顧客名は名簿にありませんでした。<br>下記より新規登録してください。");
        document.querySelector("#company-name").value = customerName;
        enableInput();
    }
}



async function updateData(){
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // スムーズなスクロール
    });
    showLoad("データ反映中・・・")
    const customerName = document.querySelector("#customerName").value;
    console.log("Customer Name:", customerName);

    const allInputs = document.querySelectorAll("input");
    const notes = document.querySelector("#notes")
    const memo = document.querySelector("#memo")
    let pushDatas = {};
    for(input of allInputs){
        let key = input.getAttribute("id");
        let val = replaceNewlines(input.value);
        pushDatas[key] = val;
    }
    pushDatas[notes.getAttribute("id")] = notes.value
    pushDatas[memo.getAttribute("id")] = memo.value
    
    let jsonData = JSON.stringify(pushDatas)
    disableInput();
    await fetch("https://eijicustomermanagement.onrender.com/updatedata",{
        method : "POST",
        headers : {"Content-Type": "application/json"},
        body : jsonData
    })
        .then(response => response.json())
        .then(data => {
            if (data === true) {
                console.log("レスポンスは true です。");
                showLoad("データが正常に反映されました。")
                enableSearch();
                getData();
            } else {
                console.log("レスポンスは true ではありません。");
                showLoad("！！データ書き込みでエラーが発生しました！！<br>担当者に確認してください。")
                enableInput()
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showLoad("！！データ書き込みでエラーが発生しました！！<br>担当者に確認してください。")
            enableInput()
        });
    /*
    google.script.run.withSuccessHandler(function(e){
        if(e===true){
        showLoad("データが正常に反映されました。")
        enableSearch();
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // スムーズなスクロール
        });
        getData()
        }else{
        showLoad("！！データ書き込みでエラーが発生しました！！<br>担当者に確認してください。")
        enableInput();
        }
    }).receiveData(customerRow,pushDatas);
    */
}

function check_gross_profit() {
    const gp_form = document.querySelector("#gross-profit");
    if (!gp_form) {
        console.error("Error: Element with ID 'gross-profit' not found.");
        return;
    }

    let sales_val = parseFloat(document.querySelector("#sales").value);
    let cost_val = parseFloat(document.querySelector("#cost").value);

    // 数値でなければ 0 を代入
    sales_val = isNaN(sales_val) ? 0 : sales_val;
    cost_val = isNaN(cost_val) ? 0 : cost_val;

    let gp_val = sales_val - cost_val;
    gp_form.value = gp_val;
}


document.querySelector("#sales").addEventListener("change",check_gross_profit);
document.querySelector("#cost").addEventListener("change",check_gross_profit);

getData();
