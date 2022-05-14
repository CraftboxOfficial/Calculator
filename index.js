const mathOperIn = document.querySelector("#math-operation-input")
const mathOperOut = document.querySelector("#math-operation-output")
const debugJson = document.querySelector("#debug-json")
const disallowedChars = new RegExp(/[^\d-+/()*^x ]/g)
const consecutiveOperators = new RegExp(/[-+/*^][-+/*^]|\+ \+|\/ \/|\* \*|\^ \^|  |\d \d|\(\)\(\)\(|\(\)\(\)\)/g)
const splitterChars = new RegExp(/ +|\+/)
const operators = [ "+", "-", "=", "*", "/", "^" ]
const parentheses = [ "(", ")" ]

const errorMessages = {
	missingOpeningBracket: "Missing opening bracket",
	missingClosingBracket: "Missing closing bracket",
	missingValueFor: "Missing value for ",
	multipleObjectsGenerated: "Parser: multiple objects genereated; expected one object",
	noObjectGenerated: "Parser: no objects generated; expected one object",
}
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
		mathOperOut.textContent = "..."
		try {
			const operationObject = lexAndPars(inputVal)

			debugJson.textContent = "Debug"
			debugJson.textContent = JSON.stringify(operationObject)

			mathOperOut.textContent = interperter(operationObject)

			const a = 123.123456789123456789

			// console.
			// console.log(a.toFixed(a.toString().split(".")[ 1 ].length > 5 ? a.toString().split(".")[ 1 ].length - 1 : a.toString().split(".")[ 1 ].length))
			// debugJson.textContent = "DEBUG"
		} catch (err) {
			mathOperOut.textContent = err
		}
	}

	inputLen = inputVal.length
})

function lexAndPars(mathOperation = "") {
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

		// makes ... - 5 --> ... + -5
		if (typeof value == "number" && prev[ prev.length - 1 ] == "-" && typeof prev[ prev.length - 2 ] == "number") {
			prev[ prev.length - 1 ] = "+"
			prev.push(value * -1)
			return prev
		}

		prev.push(value)

		return prev
	}, []).flat(2)

	// returns arr for given position to first closing bracket in given arr
	function getBracket(operArr, pos) {
		const arr = operArr.slice(pos)
		let openingBrackets = 0
		let closingBrackets = 0
		const selectedBracket = arr.reduce((prev, value) => {
			if (closingBrackets != openingBrackets || openingBrackets == 0) {
				if (value == "(") {
					openingBrackets++
				}
				if (value == ")") {
					closingBrackets++
				}

				prev.push(value)
				return prev
			}
			return prev
		}, [])

		if (openingBrackets > closingBrackets) {
			throw Error(errorMessages.missingClosingBracket)
		}

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

		if (!(arr.includes("(")) && arr.includes(")")) {
			throw Error(errorMessages.missingOpeningBracket)
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
							{
								toOperationObject(arr, index, "exponentiation")
								return
							}
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
							{
								toOperationObject(arr, index, "multiplication")
								return
							}
						case "/":
							{
								toOperationObject(arr, index, "division")
								return
							}
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
							{
								toOperationObject(arr, index, "addition")
								return
							}
						case "-":
							{
								if (typeof prevVal(arr, index) !== "undefined") {
									toOperationObject(arr, index, "subtraction")
									return
								}
								if (typeof nextVal(arr, index) == "number") {
									const oper = new Operation([ nextVal(arr, index) * -1 ], null, "simpleNumber")

									arr.splice(index, 2, oper)
									return
								}
								{
									const oper = new Operation([ nextVal(arr, index), -1 ], "multiplication")
									if (oper.values.includes(undefined)) {
										throw Error(errorMessages.missingValueFor + "multiplication")
									}
									arr.splice(index, 2, oper)
									return
								}
							}
					}
				}
			})

		}

		function toOperationObject(arr, index, operation) {
			const oper = new Operation([ prevVal(arr, index), nextVal(arr, index) ], operation, (prevVal(arr, index) == "x") || (nextVal(arr, index) == "x") ? "complexNumber" : "operation")
			if (oper.values.includes(undefined)) {
				throw Error(errorMessages.missingValueFor + operation)
			}
			arr.splice(index - 1, 3, oper)
			return
		}

		if (arr.find(val => val.toString().match(/\d+/))) {
			const oper = new Operation([ arr[ 0 ] ], null, "simpleNumber")
			arr.splice(0, 1, oper)
		}

		return arr
	}

	const output = objectifier(operArr)

	return output[ 0 ]
}

function interperter(operationObject = {}) {

	if (operationObject.type == "operation") {
		switch (operationObject.operation) {
			case "addition":
				{
					valuesRecursion(operationObject)
					return operationObject.values[ 0 ] + operationObject.values[ 1 ]
				}
			case "subtraction":
				{
					valuesRecursion(operationObject)
					return operationObject.values[ 0 ] - operationObject.values[ 1 ]
				}
			case "multiplication":
				{
					valuesRecursion(operationObject)
					return operationObject.values[ 0 ] * operationObject.values[ 1 ]
				}
			case "division":
				{
					valuesRecursion(operationObject)
					return operationObject.values[ 0 ] / operationObject.values[ 1 ]
				}
			case "exponentiation":
				{
					valuesRecursion(operationObject)
					return Math.pow(operationObject.values[ 0 ], operationObject.values[ 1 ])
				}
		}
	}

	if (operationObject.type == "simpleNumber") {
		return operationObject.values[ 0 ]
	}

	function valuesRecursion(obj) {
		for (let i = 0; i < obj.values.length; i++) {
			value = obj.values[ i ]
			if (typeof value == "object") {
				obj.values[ i ] = interperter(value)
			}
		}
	}

	return 0
}