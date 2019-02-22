
# Introduction to DevOps for Dynamics 365 Customer Engagement
  
In this blog series, we will explore building out DevOps processes and practices for Dynamics 365 Customer Engagement (CE) by following the growth of our fictional company Contoso University. 

An explanation of what DevOps is and a deeper look into the practices, processes, and principles as they apply more broadly can be found at [aka.ms/DevOps](https://aka.ms/Devops). For quick reference, we'll just include a note on what DevOps is before we move on...

>DevOps is the union of people, process, and products to enable continuous delivery of value to our end users. The contraction of “Dev” and “Ops” refers to replacing siloed Development and Operations to create multidisciplinary teams that now work together with shared and efficient practices and tools. Essential DevOps practices include agile planning, continuous integration, continuous delivery, and monitoring of applications. (Sam Guckenheimer, [What is DevOps?](https://docs.microsoft.com/en-us/azure/devops/learn/what-is-devops))

**Disclaimer**: This is by no means an exhaustive look into DevOps practices and principles. The intent is to take an applied look at how one may approach building out a DevOps practice and evolving their implementation over time. We will be sticking to YAML based build pipelines to build an understanding in the components and technologies used to achieve our goal. YAML pipelines will also allow us to easily submit each lesson into version control and share our examples.

## Getting started

The most basic setup of Dynamics 365 CE development, deployment, and testing is a manual process. We modify, export, and import a solution(s) into a downstream environment, then manually test to ensure there are no issues with solution layering, integrations, etc. That gets old quick; what we really want is to automate as much as is reasonable given some set budget, level of expertise and business constraints. The first step we can take is to implement the practice of version control for our solutions and automate migration between environments. To accomplish this we will be using Azure DevOps.

If you are unfamiliar with Azure DevOps and need to setup a new account please start with the [Get started guide for Azure Repos](https://docs.microsoft.com/en-us/azure/devops/repos/get-started/?view=azure-devops) documentation. Once you have setup of the basic environment and have an empty project jump back to this point in the blog. 

## Version control for solutions
Dynamics 365 CE solutions can be version controlled using [Solution Packager](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/compress-extract-solution-file-solutionpackager). This tool is included as part of a Nuget package so we will need to fire up a PowerShell console to download a copy; in a future blog we will include this in our automation process, for now let's learn the basics.

What does solution packager do? Essentially the tool takes our solution zip file and breaks it down into logical chunks, e.g. Entities, web resources and plugins. 

Download a copy of the Core Tools locally which includes Solution Packager using the example code below from a PowerShell terminal. Code sourced from the following article [*Download tools from NuGet*](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/download-tools-nuget)
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
- Command to unpack
- Checking in to version control

## Moving solutions between environments

## Resources

- https://aka.ms/DevOps
- [What is DevOps?](https://docs.microsoft.com/en-us/azure/devops/learn/what-is-devops)
- [Get started guide for Azure Repos](https://docs.microsoft.com/en-us/azure/devops/repos/get-started/?view=azure-devops)
- [Solution Packager](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/compress-extract-solution-file-solutionpackager)
 [Download tools from NuGet](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/download-tools-nuget)
<!--stackedit_data:
eyJoaXN0b3J5IjpbLTEwNjc5NDI4ODQsMTM2NDIyMTM2MCwxMD
Q4OTI1NzcwLDEyMTAxNDY5OCwtNjI2MzcyNzc4LDc0MDA0Nzg3
NCwtMzA4MzU3NzU2LDE5NTE0NzU3NCwtNTQxNjYwNzQyLC04OD
Q3NzUyNjNdfQ==
-->