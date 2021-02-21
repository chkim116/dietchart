const container = document.querySelector(".container")

// 글로벌하게 사용하기 위함입니다!
let loading
let workingLoading
let together = false

// 유저 데이터 그릇입니다.
const userData = {
    name: "",
    currentWeight: "0",
    goal: "0",
}

// 첫 스테이지는 이름을 입력합니다.
const stageOne = {
    title: "안녕하세요 000님 이름을 입력해 주세요.",
    input: [
        {
            name: "name",
            text: "이름입력",
        },
    ],
}

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
}

// 오늘 날짜를 가져옵니다.
function getToday() {
    const date = new Date()
    const month =
        date.getMonth() + 1 > 9
            ? `${date.getMonth() + 1}`
            : `0${date.getMonth() + 1}`
    const days = date.getDate() > 9 ? `${date.getDate()}` : `0${date.getDate()}`

    const today = `${month}.${days}`
    return today
}

// 스토리지 관련 함수, get, save, vaild
function getStorage(key) {
    return JSON.parse(localStorage.getItem(key))
}

function saveStorage(key, data) {
    return localStorage.setItem(key, JSON.stringify(data))
}

// 만약 조건이 맞으면 다음을 위한 함수가 실행됨
function validCondition(condition, next) {
    if (condition) {
        next()
    }
}

//  버튼이 비활성화 될지, 활성화 될지 체크하는 함수
function validDisableBtn(value) {
    let done
    const btnElement = document.querySelector("button")

    if (value && !done) {
        btnElement.removeAttribute("disabled")
        done = true
    } else {
        btnElement.disabled = true
        done = false
    }
}

// 이벤트 등록을 위해 다큐먼트들을 셀렉하는 함수
function selectDocument(select, name) {
    if (select) {
        const element = document.querySelector(name)
        return function (func, eventType) {
            element.addEventListener(eventType, func)
        }
    } else {
        const element = document.querySelectorAll(name)
        return function (func, eventType) {
            element.forEach((el) => el.addEventListener(eventType, func))
        }
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
            return `<input class="info__input" autocomplete="off" name=${obj.name} placeholder=${obj.text} />`
        })
        .join("")}
        <button class="info__btn" disabled type="submit">확인</button>
    </form>
    </div>  
    `
}

// 차트 만드는 HTML
function chartWeightHTML() {
    const user = getStorage("user")
    return `
    <div class="hellobox">
    <div>${user.name}님 오늘도 화이팅!</div>
    <div>시작 몸무게 <span class="user__weight">${user.currentWeight}kg</span></div>
    <div>목표 몸무게 <span class="user__weight">${user.goal}kg</span> </div>
    <button type="button" class="reset-btn">다시 적기(차트초기화)</button>
    </div>
    <h1>오늘 살 빠졌죠?</h1>
    <button type="button" class="together">운동기록이랑 같이 볼래요</button>
    <div class="reach_goal"></div>
    <form class="today__form">
    <div class="today">
    <div class="today__state">오늘 몸무게는?</div>
    <input class="today__input" name="todayWeight"  autocomplete="off" type="text" />
    <span>kg</span>
    </div>
    <button class="today__btn type="submit">확인</button>
    </form>`
}

function chartWorkingHTML() {
    return `
    <h1>오늘 운동도 했죠?</h1>
    <form class="working__form">
    <div>클릭해서 타입 바꾸기</div>
    <button type="button" class="working__type-btn" data-type="line">Line</button>
    <button type="button" class="working__type-btn" data-type="bar">Bar</button>
    <div class="working">
    <div>
    <input class="working__input" name="hours"  autocomplete="off" type="text" />
    <span>시간</span>
    </div>
    <div>
    <input class="working__input" name="minutes"  autocomplete="off" type="text" />
    <span>분</span> 
    </div>
    </div>
    <button class="working__btn type="submit">확인</button>
    </form>`
}

function handleChangeName(e) {
    const { value } = e.target

    userData.name = value
    validDisableBtn(value)
}

function handleChangeWeight(e) {
    const { name, value } = e.target

    if (name === "currentWeight") {
        userData.currentWeight = value
    } else {
        userData.goal = value
    }
    validDisableBtn(userData.currentWeight && userData.goal)
}

function handleSubmitFinish(e) {
    e.preventDefault()
    saveStorage("user", userData)
    validCondition(getStorage("user"), paintChartStage)
}

function handleSubmitName(e) {
    e.preventDefault()
    paintHTML(stageTwo)
}

// 스테이지에 따른 HTML을 출력합니다.
function paintHTML(stage) {
    container.innerHTML = userStageHTML(stage)
    const inputElement = document.querySelectorAll("input")
    inputElement[0].focus()
    selectDocument(false, "input")(
        inputElement.length === 1 ? handleChangeName : handleChangeWeight,
        "input"
    )
    selectDocument(true, "form")(
        inputElement.length === 1 ? handleSubmitName : handleSubmitFinish,
        "submit"
    )
}

// 글로벌하게 사용하기 위함입니다.
let chartData = []
let workingChartData = []
let todayWeight
let working = { hours: "", minutes: "" }

// 맵핑합니다.
function mapping(arr, filter) {
    if (Array.isArray(arr)) {
        return arr.map(filter)
    }
}

// 필터합니다.
function filtering(arr, filter) {
    if (Array.isArray(arr)) {
        return arr.filter(filter)
    }
}

function handleTodayChange(e) {
    const { name, value } = e.target

    switch (name) {
        case "todayWeight": {
            return (todayWeight = value)
        }
        case "hours": {
            return (working.hours = value)
        }
        case "minutes": {
            return (working.minutes = value)
        }
    }
}

function handleSubmitChart(e) {
    e.preventDefault()
    const obj = {
        todayWeight,
        date: getToday(),
    }
    chartData.push(obj)

    if (getStorage("data")) {
        const currentData = getStorage("data")
        const existData = filtering(
            currentData,
            (obj) => obj.date === getToday()
        )
        if (existData) {
            const refreshData = filtering(
                currentData,
                (obj) => obj.date !== getToday()
            )
            refreshData.push(obj)
            saveStorage("data", refreshData)
            paintCanvasChartJs(refreshData)
            return
        }
    }
    saveStorage("data", chartData)
    paintCanvasChartJs(chartData)
}

function handleTogetherChart(e) {
    const togetherBtn = document.querySelector(".together")
    together = !together
    together
        ? togetherBtn.classList.add("clicked")
        : togetherBtn.classList.remove("clicked")
    paintCanvasChartJs(getStorage("data"), together)
}

function handleChangeChartType(e) {
    if (
        !document
            .getElementById("working_chart")
            .classList.contains("chartjs-render-monitor")
    ) {
        return alert("기록부터 하세요!")
    }
    const { type } = e.currentTarget.dataset
    const typeBtn = document.querySelectorAll(".working__type-btn")
    typeBtn.forEach((node) =>
        node.dataset.type === type
            ? node.classList.add("clicked")
            : node.classList.remove("clicked")
    )
    saveStorage("type", type)
    paintCanvasChartJsWorking(getStorage("working"), type)
}

function handleSubmitWorkingChart(e) {
    e.preventDefault()
    const obj = {
        ...working,
        date: getToday(),
    }
    workingChartData.push(obj)

    if (getStorage("working")) {
        const currentData = getStorage("working")
        const existData = filtering(
            currentData,
            (obj) => obj.date === getToday()
        )
        if (existData) {
            const refreshData = filtering(
                currentData,
                (obj) => obj.date !== getToday()
            )
            refreshData.push(obj)
            saveStorage("working", refreshData)
            paintCanvasChartJsWorking(
                refreshData,
                getStorage("type") ? getStorage("type") : "line"
            )
            return
        }
    }
    saveStorage("working", workingChartData)
    saveStorage("type", "line")
    paintCanvasChartJsWorking(workingChartData, "line")
}

// 캔버스에 차트를 그립니다.

function paintCanvasChartJsWorking(data, type) {
    if (!workingLoading) {
        const div = document.createElement("div")
        let canvas
        if (window.innerWidth < 768) {
            canvas = `<canvas id="working_chart" width="325" height="300"></canvas>`
        } else {
            canvas = `<canvas id="working_chart" width="800" height="400"></canvas>`
        }
        div.setAttribute("class", "canvas__work_container")
        div.innerHTML = canvas
        container.appendChild(div)
        workingLoading = true
    }

    if (data) {
        const ctx = document.getElementById("working_chart")
        ctx.getContext("2d")
        const canvasContainer = document.querySelector(
            ".canvas__work_container"
        )
        const typeBtn = document.querySelectorAll(".working__type-btn")
        typeBtn.forEach((node) =>
            node.dataset.type === type
                ? node.classList.add("clicked")
                : node.classList.remove("clicked")
        )
        if (canvasContainer.childNodes.length === 2) {
            canvasContainer.removeChild(canvasContainer.childNodes[0])
        }
        const chart = new Chart(ctx, {
            type,
            data: {
                labels: mapping(data, (obj) => obj.date),
                datasets: [
                    {
                        backgroundColor: "#0984e3 ",
                        borderColor: "#0984e3",
                        data: mapping(
                            data,
                            (obj) => `${+obj.hours * 60 + +obj.minutes}`
                        ),
                        fill: false,
                        pointStyle: "rectRounded",
                        pointRadius: 5,
                        pointHoverRadius: 7,
                    },
                ],
            },

            options: {
                tooltips: {
                    callbacks: {
                        label: function (tooltipItem, data) {
                            return `${tooltipItem.yLabel}분`
                        },
                    },
                },
                legend: {
                    display: false,
                },
            },
        })
    } else {
        const canvasContainer = document.querySelector(
            ".canvas__work_container"
        )
        const hElement = document.createElement("h2")
        hElement.innerText = "등록된 운동 데이터가 아직 없습니다 :)"
        canvasContainer.prepend(hElement)
    }
}

function paintCanvasChartJs(data, isTogether) {
    if (!loading) {
        const div = document.createElement("div")
        let canvas
        if (window.innerWidth < 768) {
            canvas = `<canvas id="chart" width="325" height="300"></canvas>`
        } else {
            canvas = `<canvas id="chart" width="800" height="400"></canvas>`
        }
        div.setAttribute("class", "canvas__container")
        div.innerHTML = canvas
        container.appendChild(div)
        loading = true
    }

    if (data) {
        const ctx = document.getElementById("chart")
        ctx.getContext("2d")
        const canvasContainer = document.querySelector(".canvas__container")
        if (canvasContainer.childNodes.length === 2) {
            canvasContainer.removeChild(canvasContainer.childNodes[0])
        }
        const reachToGoal = document.querySelector(".reach_goal")
        reachToGoal.innerHTML = `
        <div>현재 무게 <span style="color: red">${
            data[data.length - 1].todayWeight
        }kg </span>
        </div>
        <div>목표 ${getStorage("user").goal}kg 까지 <span style="color: red">${
            +getStorage("user").goal - +data[data.length - 1].todayWeight
        }kg!!</span></div>`
        const chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: mapping(data, (obj) => obj.date),
                datasets: !isTogether
                    ? [
                          {
                              labels: ["kg"],
                              backgroundColor: "#fd79a8",
                              borderColor: "#fd79a8",
                              data: mapping(data, (obj) => obj.todayWeight),
                              fill: false,
                              pointStyle: "rectRounded",
                              pointRadius: 5,
                              pointHoverRadius: 7,
                          },
                          {
                              labels: ["kg"],
                              backgroundColor: "red",
                              borderColor: "red",
                              fill: false,
                              data: new Array(data.length).fill(
                                  getStorage("user").goal
                              ),
                              pointRadius: 0,
                              pointHoverRadius: 0,
                          },
                      ]
                    : [
                          {
                              labels: ["kg"],
                              backgroundColor: "#fd79a8",
                              borderColor: "#fd79a8",
                              data: mapping(data, (obj) => obj.todayWeight),
                              fill: false,
                              pointStyle: "rectRounded",
                              pointRadius: 7,
                              pointHoverRadius: 7,
                          },
                          {
                              labels: ["분"],
                              backgroundColor: "#0984e3 ",
                              borderColor: "#0984e3",
                              data: mapping(
                                  getStorage("working"),
                                  (obj) => `${+obj.hours * 60 + +obj.minutes}`
                              ),
                              fill: false,
                              pointStyle: "rectRounded",
                              pointRadius: 7,
                              pointHoverRadius: 7,
                          },
                      ],
            },

            options: {
                scales: {
                    yAxes: [
                        {
                            ticks: {
                                min: +getStorage("user").goal - 2,
                            },
                        },
                    ],
                },
                tooltips: {
                    callbacks: {
                        label: function (tooltipItem, data) {
                            const dataset =
                                data.datasets[tooltipItem.datasetIndex]
                            const yLabel = dataset.labels[0]
                            return `${tooltipItem.yLabel}${yLabel}`
                        },
                    },
                },
                legend: {
                    display: false,
                },
            },
        })
    } else {
        const canvasContainer = document.querySelector(".canvas__container")
        const hElement = document.createElement("h2")
        hElement.innerText = "등록된 데이터가 아직 없습니다 :)"
        canvasContainer.prepend(hElement)
    }
}

// 리셋합니다. 처음부터 다시 시작.
function resetStage() {
    if (window.confirm("모든게 초기화 됩니다!")) {
        loading = false
        workingLoading = false
        localStorage.removeItem("user")
        localStorage.removeItem("data")
        localStorage.removeItem("working")
        localStorage.removeItem("type")
        chartData = []
        workingChartData = []
        init()
    }
}

// 차트 스테이지를 그리고, 이벤트를 등록합니다.
function paintChartStage(alreadyData) {
    container.innerHTML = chartWeightHTML()
    paintCanvasChartJs(alreadyData)

    const workingDiv = document.createElement("div") // 운동 차트
    workingDiv.innerHTML = chartWorkingHTML()
    container.appendChild(workingDiv)

    if (getStorage("working")) {
        const typeBtn = document.querySelectorAll(".working__type-btn")
        typeBtn.forEach((node) =>
            node.dataset.type === getStorage("type")
                ? node.classList.add("clicked")
                : node.classList.remove("clicked")
        )

        paintCanvasChartJsWorking(
            getStorage("working"),
            getStorage("type") ? getStorage("type") : "line"
        )
    } else {
        paintCanvasChartJsWorking()
    }

    selectDocument(true, ".reset-btn")(resetStage, "click")
    selectDocument(false, "input")(handleTodayChange, "input")
    selectDocument(true, ".today__form")(handleSubmitChart, "submit")
    selectDocument(true, ".working__form")(handleSubmitWorkingChart, "submit")
    selectDocument(false, ".working__type-btn")(handleChangeChartType, "click")
    selectDocument(false, ".together")(handleTogetherChart, "click")
}

// 초기 시작시 실행되는 함수. 스토리지에 유저가 있으면 스토리지에 저장된 데이터를 사용해 바로 차트를 그립니다.
function init() {
    if (getStorage("user")) {
        return paintChartStage(getStorage("data") && getStorage("data"))
    }
    paintHTML(stageOne)
}

init()
