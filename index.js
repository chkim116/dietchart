const container = document.querySelector(".container");

// 글로벌하게 사용하기 위함입니다.
let loading;

// 유저 데이터 그릇입니다.
const userData = {
    name: "",
    currentWeight: "0",
    goal: "0",
};

// 첫 스테이지는 이름을 입력합니다.
const stageOne = {
    title: "안녕하세요 000님 이름을 입력해 주세요.",
    input: [
        {
            name: "name",
            text: "이름입력",
        },
    ],
};

// 두번째 스테이지는 현재 몸무게와 목표 몸무게를 입력합니다.
const stageTwo = {
    title: "현재 몸무게와 목표 몸무게를 입력해 주세요. 숫자만 적으시면 됩니다.",
    input: [
        {
            name: "currentWeight",
            text: "현재몸무게",
        },
        {
            name: "goal",
            text: "목표몸무게",
        },
    ],
};

// 오늘 날짜를 가져옵니다.
function getToday() {
    const date = new Date();
    const month =
        date.getMonth() + 1 > 9
            ? `${date.getMonth() + 1}`
            : `0${date.getMonth() + 1}`;
    const days =
        date.getDate() > 9 ? `${date.getDate()}` : `0${date.getDate()}`;

    const today = `${month}.${days}`;
    return today;
}

// 스토리지 관련 함수, get, save, vaild
function getStorage(key) {
    return JSON.parse(localStorage.getItem(key));
}

function saveStorage(key, data) {
    return localStorage.setItem(key, JSON.stringify(data));
}

// 만약 조건이 맞으면 다음을 위한 함수가 실행됨
function validCondition(condition, next) {
    if (condition) {
        next();
    }
}

//  버튼이 비활성화 될지, 활성화 될지 체크하는 함수
function validDisableBtn(value) {
    let done;
    const btnElement = document.querySelector("button");

    if (value && !done) {
        btnElement.removeAttribute("disabled");
        done = true;
    } else {
        btnElement.disabled = true;
        done = false;
    }
}

// 이벤트 등록을 위해 다큐먼트들을 셀렉하는 함수
function selectDocument(select, name) {
    if (select) {
        const element = document.querySelector(name);
        return function (func, eventType) {
            element.addEventListener(eventType, func);
        };
    } else {
        const element = document.querySelectorAll(name);
        return function (func, eventType) {
            element.forEach((el) => el.addEventListener(eventType, func));
        };
    }
}

//  user 정보를 입력하는 단계의 html
function userStageHTML(stage) {
    return `
    <div class="info__title">${stage.title}</div>
    <div class="info__textbox">
    <form class="info__form">
    ${stage.input
        .map((obj) => {
            return `<input class="info__input" autocomplete="off" name=${obj.name} placeholder=${obj.text} />`;
        })
        .join("")}
        <button class="info__btn" disabled type="submit">확인</button>
    </form>
    </div>  
    `;
}

// 차트 만드는 HTML
function chartHTML() {
    const user = getStorage("user");
    return `
    <div class="hellobox">
    <div>${user.name}님 오늘도 화이팅!</div>
    <div>시작 몸무게 <span class="user__weight">${user.currentWeight}kg</span></div>
    <div>목표 몸무게 <span class="user__weight">${user.goal}kg</span> </div>
    <button type="button" class="reset-btn">다시 적기(차트초기화)</button>
    </div>
    <h1>오늘 운동 하셨죠?</h1>
    <form class="today__form">
    <div class="today__state">오늘 몸무게</div>
    <div>
    <input class="today__input" name="todayWeight"  autocomplete="off" type="text" />
    <span>kg</span>
    </div>
    <button class="today__btn type="submit">확인</button>
    </form>`;
}

function handleChangeName(e) {
    const { value } = e.target;

    userData.name = value;
    validDisableBtn(value);
}

function handleChangeWeight(e) {
    const { name, value } = e.target;

    if (name === "currentWeight") {
        userData.currentWeight = value;
    } else {
        userData.goal = value;
    }
    validDisableBtn(userData.currentWeight && userData.goal);
}

function handleSubmitFinish(e) {
    e.preventDefault();
    saveStorage("user", userData);
    validCondition(getStorage("user"), paintChartStage);
}

function handleSubmitName(e) {
    e.preventDefault();
    paintHTML(stageTwo);
}

// 스테이지에 따른 HTML을 출력합니다.
function paintHTML(stage) {
    container.innerHTML = userStageHTML(stage);
    const inputElement = document.querySelectorAll("input");
    selectDocument(false, "input")(
        inputElement.length === 1 ? handleChangeName : handleChangeWeight,
        "input"
    );
    selectDocument(true, "form")(
        inputElement.length === 1 ? handleSubmitName : handleSubmitFinish,
        "submit"
    );
}

// 글로벌하게 사용하기 위함입니다.
let chartData = [];
let todayWeight;

// 맵핑합니다.
function mapping(arr, filter) {
    if (Array.isArray(arr)) {
        return arr.map(filter);
    }
}

// 필터합니다.
function filtering(arr, filter) {
    if (Array.isArray(arr)) {
        return arr.filter(filter);
    }
}

function handleTodayChange(e) {
    const { value } = e.target;
    todayWeight = value;
}

function handleSubmitChart(e) {
    e.preventDefault();
    const obj = {
        todayWeight,
        date: getToday(),
    };
    chartData.push(obj);

    if (getStorage("data")) {
        const currentData = getStorage("data");
        const existData = filtering(
            currentData,
            (obj) => obj.date === getToday()
        );
        if (existData) {
            const refreshData = filtering(
                currentData,
                (obj) => obj.date !== getToday()
            );
            refreshData.push(obj);
            saveStorage("data", refreshData);
            paintCanvasChartJs(refreshData);
            return;
        }
    }
    saveStorage("data", chartData);
    paintCanvasChartJs(chartData);
}

// 캔버스에 차트를 그립니다.

function paintCanvasChartJs(data) {
    if (!loading) {
        const div = document.createElement("div");
        const canvas = `<canvas id="chart" width="800" height="400"></canvas>`;
        div.innerHTML = canvas;
        container.appendChild(div);
        loading = true;
    }
    const ctx = document.getElementById("chart");
    ctx.getContext("2d");

    if (data) {
        const chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: mapping(data, (obj) => obj.date),
                datasets: [
                    {
                        backgroundColor: "#fff",
                        borderColor: "#333",
                        data: mapping(data, (obj) => obj.todayWeight),
                        fill: false,
                        pointStyle: "rectRounded",
                    },
                ],
            },

            options: {
                tooltips: {
                    callbacks: {
                        labelColor: function (tooltipItem, chart) {
                            return {
                                borderColor: "#333",
                                backgroundColor: "#333",
                            };
                        },
                        label: function (tooltipItem, data) {
                            return tooltipItem.yLabel;
                        },
                    },
                },
                legend: {
                    display: false,
                },
            },
        });
    } else {
        const cavasContainer = document.querySelector(".canvas__container");
        const hElement = document.createElement("h2");
        hElement.innerText = "등록된 데이터가 아직 없습니다 :)";
        cavasContainer.prepend(hElement);
    }
}

function resetStage() {
    if (window.confirm("모든게 초기화 됩니다!")) {
        localStorage.removeItem("user");
        localStorage.removeItem("data");
        init();
    }
}

// 차트 스테이지를 그리고, 이벤트를 등록합니다.
function paintChartStage(alreadyData) {
    container.innerHTML = chartHTML();
    paintCanvasChartJs(alreadyData);
    selectDocument(true, ".reset-btn")(resetStage, "click");
    selectDocument(false, "input")(handleTodayChange, "input");
    selectDocument(true, "form")(handleSubmitChart, "submit");
}

// 초기 시작시 실행되는 함수. 스토리지에 유저가 있으면 스토리지에 저장된 데이터를 사용해 바로 차트를 그립니다.
function init() {
    if (getStorage("user")) {
        return paintChartStage(getStorage("data") && getStorage("data"));
    }
    paintHTML(stageOne);
}

init();
