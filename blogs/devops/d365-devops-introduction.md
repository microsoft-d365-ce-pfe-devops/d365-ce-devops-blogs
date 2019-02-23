
# Introduction to DevOps for Dynamics 365 Customer Engagement
  
In this blog series, we will explore building out DevOps processes and practices for Dynamics 365 Customer Engagement (CE) by following the growth of our fictional company Contoso University. 

An explanation of what DevOps is and a deeper look into the practices, processes, and principles as they apply more broadly can be found at [aka.ms/DevOps](https://aka.ms/Devops). For quick reference, we'll just include a note on what DevOps is before we move on...

>DevOps is the union of people, process, and products to enable continuous delivery of value to our end users. The contraction of “Dev” and “Ops” refers to replacing siloed Development and Operations to create multidisciplinary teams that now work together with shared and efficient practices and tools. Essential DevOps practices include agile planning, continuous integration, continuous delivery, and monitoring of applications. (Sam Guckenheimer, [What is DevOps?](https://docs.microsoft.com/en-us/azure/devops/learn/what-is-devops))

**Disclaimer**: This is by no means an exhaustive look into DevOps practices and principles. The intent is to take an applied look at how one may approach building out a DevOps practice and evolving their implementation over time. We will be sticking to YAML based build pipelines to build an understanding in the components and technologies used to achieve our goal. YAML pipelines will also allow us to easily submit each lesson into version control so that we may share our examples.

## Getting started

If you already have an Dynamics 365 CE environment, Azure DevOps and a solution ready to go skip to [Moving solutions between environments](#Moving solutions between environments)

The most basic setup of Dynamics 365 CE development, deployment, and testing is a manual process. We modify, export, and import a solution(s) into a downstream environment, then manually test to ensure there are no issues with solution layering, integrations, etc. That gets old quick; what we really want is to automate as much as is reasonable given some set budget, level of expertise and business constraints. The first step we can take is to implement the practice of version control for our solutions and automate migration between environments. To accomplish this we will be using Azure DevOps.

**What we will need**

 - Azure Repo
	 - If you are unfamiliar with Azure DevOps and need to setup a new account please start with the [Get started guide for Azure Repos](https://docs.microsoft.com/en-us/azure/devops/repos/get-started/?view=azure-devops) documentation. 
 - [Dynamics 365 CE environment trial](https://trials.dynamics.com/) or follow along using your own environment
 - Solution Packager

## Version control for solutions
Dynamics 365 CE solutions can be version controlled using [Solution Packager](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/compress-extract-solution-file-solutionpackager). This tool is included as part of a Nuget package so we will need to fire up a PowerShell console to download a copy; in a future blog we will include this in our automation process, for now let's learn the basics.

What does solution packager do? Essentially the tool takes our solution zip file and breaks it down into logical chunks, e.g. Entities, web resources and plugins. An unpacked solution can be version controlled far at a more granular level than a solution zip file so make it a good practice to always unpack solutions before committing them to your repository.  

### Download solution packager
To get started we will need to download a copy of the [Dynamics 365 CE Core Tools Nuget package](https://www.nuget.org/packages/Microsoft.CrmSdk.CoreTools) locally, which includes Solution Packager. 

**Steps to download**
1. Open a PowerShell Terminal
2. Navigate to the directory that you want the tools downloaded to. Note that the code below will create the folder structure *Tools\CoreTools* in the current directory
3. Copy & paste the code below into the terminal or new script window if using PowerShell ISE and run the script.

```PowerShell
    $sourceNugetExe = "https://dist.nuget.org/win-x86-commandline/latest/nuget.exe"
    $targetNugetExe = ".\nuget.exe"
    Remove-Item .\Tools -Force -Recurse -ErrorAction Ignore
    Invoke-WebRequest $sourceNugetExe -OutFile $targetNugetExe
    Set-Alias nuget $targetNugetExe -Scope Global -Verbose
    
    ##
    ##Download CoreTools
    ##
    ./nuget install  Microsoft.CrmSdk.CoreTools -O .\Tools
    md .\Tools\CoreTools
    $coreToolsFolder = Get-ChildItem ./Tools | Where-Object {$_.Name -match 'Microsoft.CrmSdk.CoreTools.'}
    move .\Tools\$coreToolsFolder\content\bin\coretools\*.* .\Tools\CoreTools
    Remove-Item .\Tools\$coreToolsFolder -Force -Recurse
    
    ##
    ##Remove NuGet.exe
    ##
    Remove-Item nuget.exe   
```
*The code above was sourced from the [*Download tools from NuGet*](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/download-tools-nuget) Microsoft Docs article.

### Unpacking a solution
Now that we have Solution Packager downloaded we can work on adding our Contoso University to version control. If you are following along with your own setup you will need to export an *unmanaged* copy of your solution or grab a copy of the Contoso University solution from our [GitHub repo](https://github.com/paulbreuler/D365-CE-DevOps-Tutorial).

```PowerShell
.\Tools\CoreTools\SolutionPackager.exe /action extract /zipfile {Path to file}\ContosoUniversity_1_0_0_0.zip /folder {Ouptut path}
```

### Checking in to version control

![AzureRepo-initial (Edited).png](https://github.com/paulbreuler/d365-PFE-Blogs/blob/DevOps-Intro-Blog/media/devops/AzureRepo-initial%20(Edited).png?raw=true)

## Moving solutions between environments
**TODO**
- Create new YAML script
- Build YAML and in pieces to document purpose of each step
- Demonstrate working version
- Links to GitHub repo
## Resources

- https://aka.ms/DevOps
- [What is DevOps?](https://docs.microsoft.com/en-us/azure/devops/learn/what-is-devops)
- [Get started guide for Azure Repos](https://docs.microsoft.com/en-us/azure/devops/repos/get-started/?view=azure-devops)
- [Solution Packager](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/compress-extract-solution-file-solutionpackager)
 [Download tools from NuGet](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/download-tools-nuget)

*[CE]: Customer Engagement
<!--stackedit_data:
eyJoaXN0b3J5IjpbNTkyODA5NjE4LC0xMjQwMTQ3NDgxLC0xND
IzMjU0NzQsLTExOTUzMjk1NDgsMTA2NjA2MjQ5NCwxMTQ5MDA2
OTczLC0yMDU1MTQ4ODE0LDEzNjQyMjEzNjAsMTA0ODkyNTc3MC
wxMjEwMTQ2OTgsLTYyNjM3Mjc3OCw3NDAwNDc4NzQsLTMwODM1
Nzc1NiwxOTUxNDc1NzQsLTU0MTY2MDc0MiwtODg0Nzc1MjYzXX
0=
-->