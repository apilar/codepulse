# Code Pulse

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) [![GitHub release](https://img.shields.io/github/release/codedx/codepulse.svg)](https://github.com/codedx/codepulse/releases) [![Build status](https://ci.appveyor.com/api/projects/status/ifckp12pjgi96jxs?svg=true)](https://ci.appveyor.com/project/CodeDx/codepulse) [![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/1760/badge)](https://bestpractices.coreinfrastructure.org/projects/1760) [![Github All Releases](https://img.shields.io/github/downloads/codedx/codepulse/total.svg)](https://github.com/codedx/codepulse) [![OWASP Labs](https://img.shields.io/badge/owasp-labs%20project-f7b73c.svg)](https://www.owasp.org/index.php/OWASP_Project_Inventory#tab=Labs_Projects)

Code Pulse is a real-time code coverage tool. It works by monitoring Java or .NET Framework applications while they run, keeps track of coverage data, and shows you what's being called and when. Code Pulse currently supports Java programs up to Java 11, and .NET Framework programs for CLR versions 2 & 4.

## Layout

**agent/** Contains the Java tracer source.

**bytefrog/** Contains the [bytefrog](https://github.com/codedx/bytefrog) source upon which the Java tracer depends.

**codepulse/** Contains the web app source.

**distrib/** Contains files that are used to package up the entirety of Code Pulse into a native app, using [node-webkit](https://github.com/rogerwang/node-webkit) in place of a browser, and [jetty](http://www.eclipse.org/jetty/) to run the server. All third party dependencies are downloaded automatically within SBT at package time.

**dotnet-symbol-service/** Contains the [.NET Symbol Service](https://github.com/codedx/dotnet-symbol-service) source upon which the .NET tracer depends.

**dotnet-tracer/** Contains the .NET tracer source that is based on a custom version of [OpenCover](https://github.com/codedx/opencover).

**installers/** Contains the scripts to package the Code Pulse software for macOS, Linux, and Windows.

**project/** Contains the SBT build definition.

## Development Environment Setup
The following section describes steps necessary to build and run Code Pulse from source. If you want to download a pre-built version of Code Pulse to run, please visit our [releases](https://github.com/codedx/codepulse/releases) page for downloads.

Code Pulse lets you trace Java and .NET Framework applications. Use Windows to build a development environment that supports all Code Pulse features. If you are not interested in tracing .NET Framework applications, you can build a development environment on a different operating system by skipping the Windows-specific steps listed below.

* **Install .NET Core 3.1 SDK**. The 3.1 version of the SDK can be downloaded from the official Microsoft website at [https://www.microsoft.com/net/download](https://www.microsoft.com/net/download).
* **[Windows Only] Enable .NET Framework 3.5 Windows feature**. To enable this feature:
  - Run "appwiz.cpl" from the run command or start menu.
  - Select the "Turn Windows features on or off" option.
  - In the Windows Features popup, find and select the ".NET Framework 3.5" feature.
  - Allow Windows to update the operating system as needed to complete the operation.
* **[Windows Only] Install Windows SDK 10.0.16299.91**. This version of the Windows SDK can be downloaded from the official Microsoft website's SDK archives at [https://developer.microsoft.com/en-us/windows/downloads/sdk-archive](https://developer.microsoft.com/en-us/windows/downloads/sdk-archive)
* **[Windows Only] Install Visual Studio 2017, including the C++ workload**. The free community edition of Visual Studio is available at [https://visualstudio.microsoft.com/vs/older-downloads/](https://visualstudio.microsoft.com/vs/older-downloads/). When installing, select the .NET and C++ desktop development workloads.
* **[Windows Only] Install Wix Toolset 3.11**. The 3.11 version of the Wix Toolset can be downloaded from the official Wix website at [http://wixtoolset.org/releases/](http://wixtoolset.org/releases/).
* **Install SBT 0.13.18**. The 0.13.18 version of SBT can be downloaded from the official SBT website at [https://www.scala-sbt.org/download.html](https://www.scala-sbt.org/download.html).
* **Install AdoptOpenJDK OpenJ9 8**. The Java JDK can be downloaded from [https://adoptopenjdk.net/?variant=openjdk8&jvmVariant=openj9](https://adoptopenjdk.net/?variant=openjdk8&jvmVariant=openj9).
  - Create a "JAVA_HOME" environment variable. Set the value of this environment variable to the root location you installed the JDK to, such as "C:\Program Files\Java\jdk1.8.0_181".
  - Add to the PATH variable the value "%JAVA_HOME%\bin".
* **Install Git**. Git can be downloaded from the official Git website at [https://git-scm.com/downloads](https://git-scm.com/downloads)
* **Install PowerShell Core**. Install PowerShell Core from [https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell](https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell).
* **[Windows Only] Change Powershell script execution policy to allow local, unsigned scripts to run**.
  - Start an elevated (administrator) command prompt.
  - Run pwsh from this command prompt.
  - Run the command "Set-ExecutionPolicy RemoteSigned"
* **Acquire Code Pulse source**. Use your preferred Git client to download the Code Pulse source from [https://github.com/codedx/codepulse](https://github.com/codedx/codepulse).
* **[Windows Only] Package Code Pulse**. Code Pulse uses Windows PowerShell to create Code Pulse releases for macOS, Linux, and Windows.
  - To build Code Pulse for installation: from Windows Powershell in the root Code Pulse directory that you git cloned to, run .\installers\build.ps1 with desired script parameter values to create packages for macOS, Linux, and Windows. You may provide the following switches to skip building for Linux, Mac, or Windows: "-skipLinux", "-skipMac", and "-skipWindows". Combine the switches as desired. For example: `.\installers\build.ps1 -version 2.5.0 -skipMac -skipLinux`
> Note: If you don't want to run Code Pulse from the development environment, you can use the installers created by build.ps1 to install and run Code Pulse.

* **Run Code Pulse from the Development Environment** - to run in development mode, where you can use a web browser to run and debug Code Pulse:
  - Start a terminal/command prompt and switch to the Code Pulse root directory
  - [Linux or macOS Only] Edit codepulse/src/main/resources/application.conf by switching systemSettings.symbolService.binary from "SymbolService.exe" to "SymbolService"
  - Run the "sbt" command from the Code Pulse root directory
  - Once sbt loads, enter the command "container:start" to start an instance of Code Pulse
  - Browse via web browser to [localhost:8080](http://localhost:8080)
  - When you are finished, enter the command "container:stop" to do a clean tear down of Code Pulse

For more information, refer to the Code Pulse [User Guide](https://github.com/codedx/codepulse/wiki/user-guide).

## License

Code Pulse is made available under the terms of the Apache License 2.0. See the LICENSE file that accompanies this distribution for the full text of the license.
