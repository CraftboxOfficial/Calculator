const mathOperIn = document.querySelector("#math-operation-input")
const mathOperOut = document.querySelector("#math-operation-output")

const disallowedChars = new RegExp(/[^\d-+/()*^x ]/g)
const consecutiveOperators = new RegExp(/--|\+\+|\/\/|\*\*|\^\^|  |\d \d|\(\)\(\)\(|\(\)\(\)\)/g)
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

	let operationObject = {}
	// updates output only when there is a change in operation; excludes adding spaces
	if (inputVal.length != inputLen) {
		function parseOperation(operation) {
			const parsedOperation = parser(operation)
			if (parsedOperation.length == 1) {
				return parsedOperation[ 0 ]
			} else {
				throw Error("Parser returned multiple objects; expected one object")
			}
		}

		try {
			operationObject = parseOperation(inputVal)
		} catch {
			operationObject = new Operation("Internal Error occurred", null, "Error")
		}
	}

	mathOperOut.textContent = JSON.stringify(operationObject)
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
	function getBracket(operArr, pos) {
		const arr = operArr.slice(pos)
		let openingBrackets = 0
		let closingBracket = 0
		const selectedBracket = arr.reduce((prev, value, index) => {
			if (closingBracket != openingBrackets || openingBrackets == 0) {
				if (value == "(") {
					openingBrackets++
				}
				if (value == ")") {
					closingBracket++
				}

				prev.push(value)
				return prev
			}
			return prev
		}, [])

		selectedBracket.shift()
		selectedBracket.pop()

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
			for (let index = 0; index < arr.length; index++) {
				value = arr[ index ]
				if (value == "(") {
					arr.splice(index, (getBracket(arr, index).length + 2), objectifier(getBracket(arr, index)))
					arr = arr.flat(2)
					break
				}
			}
		}

		// replaces in the array every multiplication and division in given scope of operation, going from left to right
		while (arr.includes("^")) {
			arr.forEach((value, index, arr) => {
				if (value == "^") {
					switch (value) {
						case "^":
							arr.splice(index - 1, 3, new Operation([ prevVal(arr, index), nextVal(arr, index) ], "exponentiation"))
							return
					}
				}
			})
		}

		// replaces in the array every multiplication and division in given scope of operation, going from left to right
		while (arr.includes("*") || arr.includes("/")) {
			arr.forEach((value, index, arr) => {
				if (value == "*" || value == "/") {
					switch (value) {
						case "*":
							arr.splice(index - 1, 3, new Operation([ prevVal(arr, index), nextVal(arr, index) ], "multiplication"))
							return
						case "/":
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
							arr.splice(index - 1, 3, new Operation([ prevVal(arr, index), nextVal(arr, index) ], "addition"))
							return
						case "-":
							arr.splice(index - 1, 3, new Operation([ prevVal(arr, index), nextVal(arr, index) ], "subtraction"))
							return
					}
				}
			})
		}

		return arr
	}

	return objectifier(operArr)
}