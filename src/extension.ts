// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {Client4} from 'mattermost-redux/client';
import * as wsclient from 'mattermost-redux/client/websocket_client';

let statusItem: vscode.StatusBarItem;
let output: vscode.OutputChannel;

const rootConfigName = 'mattermost';
const generalConfigPath = `${rootConfigName}.general`;
const serverURLName = `serverUrl`;
const serverURLPath = `${generalConfigPath}.${serverURLName}`;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate({ subscriptions }: vscode.ExtensionContext) {

	output = vscode.window.createOutputChannel("Mattermost");
	output.appendLine("Activiting Mattermost extension");
	loadServerUrl();

	subscriptions.push(vscode.commands.registerCommand('mattermost.init.login', promptLogin));

	// create a new status bar item that we can now manage
	statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusItem.command = 'mattermost.init.login';
	statusItem.text = "Mattermost";
	statusItem.show();

	subscriptions.push(statusItem);
	subscriptions.push(vscode.workspace.onDidChangeConfiguration(onChangeConfiguration));
}

// this method is called when your extension is deactivated
export function deactivate() {}

function loadServerUrl(): void {	
	const serverUrl = vscode.workspace.getConfiguration(generalConfigPath)[serverURLName];
	if (!serverUrl)
	{
		output.appendLine(`No URL provided for Mattermost`);
	}
	else
	{
		output.appendLine(`Setting URL: ${serverUrl}`);
		Client4.setUrl(serverUrl);
	}
}

async function promptLogin(): Promise<void> {
	const username = await vscode.window.showInputBox({
		title: "Username",
		placeHolder: 'Please enter your username for mattermost.'
	});
	const password = await vscode.window.showInputBox({
		title: "Password",
		password: true,
		placeHolder: 'Please enter your password for mattermost.'
	});

	// Verify values provided for both username and password.
	if (username && password)
	{
		try
		{
			const user = await Client4.login(username, password);
			wsclient.default.initialize(Client4.getToken(), {});
			wsclient.default.setEventCallback((msg) => { output.appendLine(`Message: ${msg}`) })

			output.appendLine(`Success logging in: ${username}`);
		}
		catch (e)
		{
			output.appendLine(`Failure logging in: ${username} -- ${e}`);
		}
	}
}

function onChangeConfiguration(e: vscode.ConfigurationChangeEvent): void {
	if (e.affectsConfiguration(serverURLPath))
	{
		const serverUrl: string | undefined = vscode.workspace.getConfiguration(generalConfigPath).get(serverURLName);
		output.appendLine(`Updating URL: ${serverUrl}`)
		if (serverUrl) {
			Client4.setUrl(serverUrl);
		}
	}
}
