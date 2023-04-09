/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL");
	const target = ns.args[0];
	const homeServer = "home";
	const grower = "batch-grow.js";
	const weakener = "batch-weaken.js";
	const hacker = "batch-hack.js"
	const virusRam = ns.getScriptRam(grower);
	const cracks = {
		"BruteSSH.exe": ns.brutessh,
		"FTPCrack.exe": ns.ftpcrack,
		"relaySMTP.exe": ns.relaysmtp,
		"HTTPWorm.exe": ns.httpworm,
		"SQLInject.exe": ns.sqlinject
	};
	const targetHackTime = ns.getHackTime(target);
	const targetGrowTime = ns.getGrowTime(target);
	const targetWeakenTime = ns.getWeakenTime(target);

	function getNumCracks() {
		return Object.keys(cracks).filter(function (file) {
			return ns.fileExists(file, homeServer);
		}).length;

	}

	function penetrate(server) {
		for (let crack of Object.keys(cracks)) {
			if (ns.fileExists(crack, homeServer)) {
				let runScript = cracks[crack];
				runScript(server)
			}
		}
	}

	function searchServers() {
		let visited = [];
		let stack = [];
		let origin = "home";
		stack.push(origin);

		while (stack.length > 0) {
			let currentServer = stack.pop();
			if (!visited.includes(currentServer)) {
				visited.push(currentServer);
				let neighbours = ns.scan(currentServer);
				for (let i = 0; i < neighbours.length; i++) {
					let child = neighbours[i];
					if (visited[child]) {
						continue;
					}
					stack.push(child)
				}
			}
		}
		return visited
	}

	function canHack(server) {
		let numCracks = getNumCracks();
		let reqPorts = ns.getServerNumPortsRequired(server);
		let ramAvail = ns.getServerMaxRam(server);
		return numCracks >= reqPorts && ramAvail > virusRam
	}

	function getTargetServers() {
		let networkServers = searchServers();
		let targets = networkServers.filter(function (server) { return canHack(server); });
		return targets;
	}

	function otherThreadCalc() {
		const neededHackThreads = Math.floor((ns.getServerMaxMoney(target) / (ns.getServerMaxMoney(target) * ns.hackAnalyze(target))) * 0.99);
		const neededWeakenThreads1 = Math.ceil((neededHackThreads * 0.002) / 0.05)
		const neededGrowThreads = Math.ceil(ns.growthAnalyze(target, 396, 1))
		const neededWeakenThreads = Math.ceil((neededGrowThreads * 0.004) / 0.05);
		return [neededHackThreads, neededGrowThreads, neededWeakenThreads, neededWeakenThreads1];
	}

	function homeThreadCalc() {
		let weakenReduce = ns.weakenAnalyze(1, ns.getServer(homeServer).cpuCores)
		const neededHackThreads = Math.floor((ns.getServerMaxMoney(target) / (ns.getServerMaxMoney(target) * ns.hackAnalyze(target))) * 0.99);
		const neededWeakenThreads1 = Math.ceil((neededHackThreads * 0.002) / weakenReduce)
		const neededGrowThreads = Math.ceil(ns.growthAnalyze(target, 396, ns.getServer(homeServer).cpuCores))
		const neededWeakenThreads = Math.ceil((neededGrowThreads * 0.004) / weakenReduce);
		return [neededHackThreads, neededGrowThreads, neededWeakenThreads, neededWeakenThreads1];
	}

	function copyVirusesAndPenetrate(server) {
		ns.scp(grower, server, homeServer);
		ns.scp(hacker, server, homeServer);
		ns.scp(weakener, server, homeServer);
		if (!ns.hasRootAccess(server)) {
			let requiredPorts = ns.getServerNumPortsRequired(server);
			if (requiredPorts > 0) {
				penetrate(server);
			}
			ns.nuke(server);
		}
	}

	function threadCalc() {
		let totalThreads = 0;
		let targetServers = getTargetServers();
		let numOfServers = targetServers.length;
		for (let i = 0; i < numOfServers; i++) {
			let maxThreads = Math.floor(ns.getServerMaxRam(targetServers[i]) / virusRam);
			totalThreads = totalThreads + maxThreads;
		}
		return totalThreads;
	}


	async function mainLogic() {
		let sleepTimeDiff = 200
		let i = 0
		let x = 0
		let y = 0
		let totalThreads = threadCalc();
		const targetServers = getTargetServers();
		for (let server of targetServers) {
			copyVirusesAndPenetrate(server)
		}
		const otherThreads = otherThreadCalc(targetServers[i]);
		const totalNeededTherads = otherThreads[0] + otherThreads[1] + otherThreads[2] + otherThreads[3];
		const homeThreads = homeThreadCalc();
		const totalNeededHomeThreads = homeThreads[0] + homeThreads[1] + homeThreads[2] + homeThreads[3];
		while (targetServers[i] == homeServer) {
			await ns.sleep(100);
			const neededHackThreads = homeThreads[0];
			const neededGrowThreads = homeThreads[1];
			const neededHackWeakenThreads = homeThreads[3];
			const neededGrowWeakenThreads = homeThreads[2];
			if ((Math.floor((ns.getServerMaxRam(homeServer) - ns.getServerUsedRam(homeServer)) / virusRam)) >= totalNeededHomeThreads) {
				ns.exec(weakener, homeServer, neededHackWeakenThreads, target, (100), y, x);
				x = x + 1
				ns.exec(weakener, homeServer, neededGrowWeakenThreads, target, (300), y, x);
				ns.exec(grower, homeServer, neededGrowThreads, target, (200 + targetWeakenTime - targetGrowTime), y);
				ns.exec(hacker, homeServer, neededHackThreads, target, (targetWeakenTime - targetHackTime), y);
				y = y + 1
				sleepTimeDiff = sleepTimeDiff + 100;
				totalThreads = totalThreads - totalNeededHomeThreads;
			} else if ((Math.floor((ns.getServerMaxRam(homeServer) - ns.getServerUsedRam(homeServer)) / virusRam)) < 1) {
				i = i + 1;
				break;
			} else if ((Math.floor((ns.getServerMaxRam(homeServer) - ns.getServerUsedRam(homeServer)) / virusRam)) < totalNeededHomeThreads) {
				i = i + 1;
				break
			}
		}
		while (true) {
			const neededHackThreads = otherThreads[0];
			const neededGrowThreads = otherThreads[1];
			const neededHackWeakenThreads = otherThreads[3];
			const neededGrowWeakenThreads = otherThreads[2];
			await ns.sleep(100);
			if (sleepTimeDiff > targetHackTime) {
				break;
			}
			if (y > 1500) {
				break;
			}
			if (totalNeededTherads > totalThreads) {
				ns.print("Run out of Threads");
				break;
			} else if (((ns.getServerMaxRam(targetServers[i]) - ns.getServerUsedRam(targetServers[i])) / virusRam) >= totalNeededTherads) {
				ns.exec(weakener, targetServers[i], neededHackWeakenThreads, target, (100), y, x);
				x = x + 1
				ns.exec(weakener, targetServers[i], neededGrowWeakenThreads, target, (300), y, x);
				ns.exec(grower, targetServers[i], neededGrowThreads, target, (200 + targetWeakenTime - targetGrowTime), y);
				ns.exec(hacker, targetServers[i], neededHackThreads, target, (targetWeakenTime - targetHackTime), y);
				y = y + 1
				sleepTimeDiff = sleepTimeDiff + 100;
				totalThreads = totalThreads - totalNeededTherads;
			} else if (((ns.getServerMaxRam(targetServers[i]) - ns.getServerUsedRam(targetServers[i])) / virusRam) < 1) {
				i = i + 1;
				continue;
			} else if (((ns.getServerMaxRam(targetServers[i]) - ns.getServerUsedRam(targetServers[i])) / virusRam) < totalNeededTherads) {
				let tempHackWeakenThreads = neededHackWeakenThreads;
				let tempGrowWeakenThreads = neededGrowWeakenThreads;
				let tempHackThreads = neededHackThreads;
				let tempGrowThreads = neededGrowThreads;
				while (tempHackWeakenThreads + tempGrowWeakenThreads + tempHackThreads + tempGrowThreads > 0) {
					if (i > targetServers.length) {
						break;
					}
					let serverCurrentThreads = Math.floor((ns.getServerMaxRam(targetServers[i]) - ns.getServerUsedRam(targetServers[i])) / virusRam);
					if (serverCurrentThreads == 0) {
						i = i + 1
						continue;
					}

					if (tempHackWeakenThreads == 0) {
						ns.print("Continue")
					} else if (serverCurrentThreads >= tempHackWeakenThreads) {
						ns.exec(weakener, targetServers[i], tempHackWeakenThreads, target, (100), y, x);
						serverCurrentThreads = serverCurrentThreads - tempHackWeakenThreads
						tempHackWeakenThreads = 0;
						continue;
					} else if (serverCurrentThreads < tempHackWeakenThreads) {
						ns.exec(weakener, targetServers[i], serverCurrentThreads, target, (100), y, x);
						tempHackWeakenThreads = tempHackWeakenThreads - serverCurrentThreads;
						i = i + 1;
						continue;
					}

					if (tempGrowWeakenThreads == 0) {
						ns.print("Continue");
					} else if (serverCurrentThreads >= tempGrowWeakenThreads) {
						ns.exec(weakener, targetServers[i], tempGrowWeakenThreads, target, (300), y, x, 0);
						serverCurrentThreads = serverCurrentThreads - tempGrowWeakenThreads;
						tempGrowWeakenThreads = 0;
						continue;
					} else if (serverCurrentThreads < tempGrowWeakenThreads) {
						ns.exec(weakener, targetServers[i], serverCurrentThreads, target, (300), y, x, 0);
						tempGrowWeakenThreads = tempGrowWeakenThreads - serverCurrentThreads;
						i = i + 1;
						continue;
					}

					if (tempGrowThreads == 0) {
						ns.print("Continue");
					} else if (serverCurrentThreads >= tempGrowThreads) {
						ns.exec(grower, targetServers[i], tempGrowThreads, target, (200 + targetWeakenTime - targetGrowTime), y);
						serverCurrentThreads = serverCurrentThreads - tempGrowThreads;
						tempGrowThreads = 0;
						continue;
					} else if (serverCurrentThreads < tempGrowThreads) {
						ns.exec(grower, targetServers[i], serverCurrentThreads, target, (200 + targetWeakenTime - targetGrowTime), y);
						tempGrowThreads = tempGrowThreads - serverCurrentThreads;
						i = i + 1;
						continue;
					}

					if (tempHackThreads == 0) {
						ns.print("Continue");
					} else if (serverCurrentThreads >= tempHackThreads) {
						ns.exec(hacker, targetServers[i], tempHackThreads, target, (targetWeakenTime - targetHackTime), y);
						serverCurrentThreads = serverCurrentThreads - tempHackThreads;
						tempHackThreads = 0;
						continue;
					} else if (serverCurrentThreads < tempHackThreads) {
						ns.exec(hacker, targetServers[i], serverCurrentThreads, target, (targetWeakenTime - targetHackTime), y);
						tempHackThreads = tempHackThreads - serverCurrentThreads;
						i = i + 1;
						continue;
					}
				}
				x = x + 1;
				y = y + 1;
				sleepTimeDiff = sleepTimeDiff + 100;
				totalThreads = totalThreads - totalNeededTherads;
			}
		}
		return sleepTimeDiff + targetWeakenTime;
	}

	while (true) {
		await ns.sleep(await mainLogic() + 30000);
	}
}
