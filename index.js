const mathOperIn = document.querySelector("#math-operation-input")
const mathOperOut = document.querySelector("#math-operation-output")

const disallowedChars = new RegExp(/[^\d-+/()*^x ]/g)
const consecutiveOperators = new RegExp(/--|\+\+|\/\/|\*\*|\^\^|  |\d \d/g)
const splitterChars = new RegExp(/ +|\+/)
const operators = [ "+", "-", "=", "*", "/", "^" ]
const parentheses = [ "(", ")" ]

class Operation {
	constructor(values = [], operation = "", type = "operation") {
		this.type = type
		this.operation = operation
		this.values = values
	}
}

const operationTree = {

}

let inputLen = 0

mathOperIn.addEventListener("input", (event) => {
	// blocks any unwanted input
	let inputVal = mathOperIn.value.trimStart().replace(disallowedChars, "")
	if (inputVal.match(consecutiveOperators)) {
		inputVal = inputVal.replace(/.$/, "")
	}

	mathOperIn.value = inputVal
	// mathOperOut.textContent = mathOperIn.value

	// updates output only when there is a change in operation; excludes adding spaces
	if (inputVal.length != inputLen) {
		mathOperOut.textContent = parser(inputVal)
		// console.log(parser(inputVal))
	}
	inputLen = inputVal.length
})

function parser(mathOperation = "") {
	const charsArr = mathOperation.split("").filter(char => char != " ").map(value => isNaN(parseFloat(value)) ? value : parseFloat(value))

	// expands shorthands in math operation and fixes spereated numbers
	const operArr = charsArr.reduce((prev, value, index) => {
		const prevVal = prev[ prev.length - 1 ] || NaN

		// adds '*' where isn't need to be written, but exists in operation
		function isOper(val) {
			return (operators.includes(val) || parentheses.includes(val))
		}
		if (
			(
				(prevVal == ")" && (typeof value == "number" || !isOper(value))) || // makes (...)2 --> (...) * 2
				(value == "(" && (typeof prevVal == "number" || !isOper(prevVal))) || // makes 2(...) --> 2 * (...)
				(!isOper(value) && !isOper(prevVal)) || // makes xx --> x * x
				(prevVal == ")" && value == "(") // makes ()() --> () * ()
			)
			&& index != 0
			&& !(typeof value == "number" && typeof prevVal == "number")
		) {
			prev.push("*")
		}

		// combines seperated digits of multidigit number into multidigit number
		if (typeof value == "number" && typeof prev[ prev.length - 1 ] == "number") {
			let number = prev[ prev.length - 1 ].toString() + value.toString()
			prev[ prev.length - 1 ] = parseFloat(number)
			return prev
		}

		prev.push(value)

		return prev
	}, [])

	// returns arr for given position to first closing bracket in given arr
	function getBracket(operArr, pos) { // <- !!BUG!! ((2+2)(2+2)) sees as ((2+2)(2+2)
		const arr = operArr.slice(pos)
		const unwantedPrefixes = arr.slice(0, arr.indexOf("("))
		// console.log("--> " + arr.indexOf("("))
		// console.log(arr.slice(0, arr.indexOf("(")))

		let openingBrackets = 0
		let closingBracket = 0
		const selectedBracket = arr.reduce((prev, value, index) => {
			if (closingBracket != openingBrackets || openingBrackets == 0) {
				if (value == "(") {
					console.log(index)
					openingBrackets++
				}
				if (value == ")") {
					closingBracket++
				}

				if (openingBrackets != 0) {
					prev.push(value)
				}
				return prev
			}
			return prev
		}, [])


		selectedBracket.shift()
		selectedBracket.pop()

		console.log(arr + " | " + selectedBracket + " | " + openingBrackets + " | " + closingBracket)

		return selectedBracket
	}

	// converts arrayed math operation into objectified math operation and returns it in an array
	function objectifier(array) {
		let arr = array.slice()
		function prevVal(array, index) {
			return array[ index - 1 ]
		}
		function nextVal(array, index) {
			return array[ index + 1 ]
		}

		// \/ this is in mathematical order of operation

		// recursively evaluates every brackets in operation
		while (arr.includes("(")) {
			arr.forEach((value, index) => {
				if (value == "(") {
					// console.log(arr)
					arr.splice(index, (getBracket(arr, index).length + 2), objectifier(getBracket(arr, index)))
					arr = arr.flat(2)
					console.log(arr)
				}
			})
		}

		// replaces in the array every multiplication and division in given scope of operation, going from left to right
		while (arr.includes("*") || arr.includes("/")) {
			arr.forEach((value, index, arr) => {
				if (value == "*" || value == "/") {
					switch (value) {
						case "*":
							// console.log("*: " + [ prevVal(arr, index), nextVal(arr, index) ])
							arr.splice(index - 1, 3, new Operation([ prevVal(arr, index), nextVal(arr, index) ], "multiplication"))
							return
						case "/":
							// console.log("/: " + [ prevVal(arr, index), nextVal(arr, index) ])
							arr.splice(index - 1, 3, new Operation([ prevVal(arr, index), nextVal(arr, index) ], "division"))
							return
					}
				}
			})
		}

		// replaces in the array every addition and subtraction in given scope of operation, going from left to right
		while (arr.includes("+") || arr.includes("-")) {
			arr.forEach((value, index, arr) => {
				if (value == "+" || value == "-") {
					switch (value) {
						case "+":
							// console.log("+: " + [ prevVal(arr, index), nextVal(arr, index) ])
							arr.splice(index - 1, 3, new Operation([ prevVal(arr, index), nextVal(arr, index) ], "addition"))
							return
						case "-":
							// console.log("-: " + [ prevVal(arr, index), nextVal(arr, index) ])
							arr.splice(index - 1, 3, new Operation([ prevVal(arr, index), nextVal(arr, index) ], "subtraction"))
							return
					}
				}
			})
		}

		return arr
	}

	// DEBUG
	const arr = objectifier(operArr)
	// console.log(arr)
	// console.log(JSON.stringify(arr))
	// console.log(operArr)
	// console.log(getBracket(operArr, 10))
	return JSON.stringify(arr)
}