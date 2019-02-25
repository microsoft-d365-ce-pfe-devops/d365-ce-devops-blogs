
# Introduction to DevOps for Dynamics 365 Customer Engagement
  
In this blog series, we will explore building out DevOps processes and practices for Dynamics 365 Customer Engagement (CE) by utilizing Azure DevOps.

What is DevOps?
>DevOps is the union of people, process, and products to enable continuous delivery of value to our end users. The contraction of “Dev” and “Ops” refers to replacing siloed Development and Operations to create multidisciplinary teams that now work together with shared and efficient practices and tools. Essential DevOps practices include agile planning, continuous integration, continuous delivery, and monitoring of applications. (Sam Guckenheimer, [What is DevOps?](https://docs.microsoft.com/en-us/azure/devops/learn/what-is-devops))
>

## Getting started

If you already have an Dynamics 365 CE environment, Azure DevOps and a solution ready to go skip to [Moving solutions between environments](#moving-solutions-between-environments). If you are new to all of this, please continue from here. 

The most basic workflow of Dynamics 365 CE development, deployment, and testing is consists primarily of manual processes. We modify, export, and import a solution(s) into a downstream environment, then manually test to ensure there are no issues with solution layering, integrations, etc. That gets old quick; what we really want is to automate as much as is reasonable given some set budget, level of expertise and business constraints. The first step we can take is to implement the practice of version control for our solutions and automate migration between environments. To accomplish this we will be using Azure DevOps.

**What we will need**

 - Azure Repo
	 - If you are unfamiliar with Azure DevOps and need to setup a new account please start with the [Get started guide for Azure Repos](https://docs.microsoft.com/en-us/azure/devops/repos/get-started/?view=azure-devops) documentation, then come back to this blog.  
 - [Dynamics 365 CE environment trial](https://trials.dynamics.com/) or follow along using your own environment.
 - Solution Packager

**Assumptions**

 - Some experience with customizing Dynamics 365 CE (CRM). 
 - A basic understanding of version control
	 - There are a number of tools to make version control easier such as [GitHub Desktop](https://desktop.github.com/), [Sourcetree](https://www.atlassian.com/software/sourcetree), and [GitKraken](https://www.gitkraken.com/) to name a few. For this series, it is expected that you know the basics or will [learn Git](https://try.github.io/) for version control.

## Version control for solutions
Solutions in Dynamics 365 CE are in essence the way we move our customizations from one envi solutions can be prepared for version control by using [Solution Packager](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/compress-extract-solution-file-solutionpackager). This tool is included as part of a Nuget package so we will need to fire up a PowerShell console to download a copy; in a future blog, we will include this in our automation process, for now let's learn the basics.

### What does solution packager do? 
Essentially Solution Packager takes our Dynamics 365 CE exported solution zip file and breaks it out into a logical folder structure that is far more friendly for version control. 

#### Example extracted solution directory structure
 - AppModules
 - AppModuleSiteMaps
 - Entities
	 - Accounts
	 - Contacts
	 - etc.
- InteractionCentricDashboards
- OptionSets
- Other
- PluginAssemblies
- Roles
- SdkMessageProcessingSteps
- Templates
- WebResources
- Workflows

### Download solution packager
To get started we will need to download a copy of the [Dynamics 365 CE Core Tools Nuget package](https://www.nuget.org/packages/Microsoft.CrmSdk.CoreTools) locally, which includes Solution Packager. 

#### Steps to download
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

### Extract solution file

Now that we have Solution Packager downloaded we can work on adding our Contoso University to version control. If you are following along with your own setup you will need to export a **{Managed, unmanaged or both???}** copy of your solution or grab a copy of the unpacked Contoso University solution from our [GitHub repo](https://github.com/paulbreuler/D365-CE-DevOps-Tutorial). Also, to use Azure DevOps you will need to upload the extracted solution to an Azure Repo, GitHub or GitHub Enterprise repository. 

#### PowerShell command to extract Dynamics 365 CE solution:
```PowerShell
.\Tools\CoreTools\SolutionPackager.exe /action extract /zipfile {Path to file}\ContosoUniversity_1_0_0_0.zip /folder {Path to local repository}
```
Once unpacked add your new files, commit and push. For this tutorial we are not going to worry about version control branching strategies but I tend to prefer [GitHub Flow](https://guides.github.com/introduction/flow/).

## Moving solutions between environments using a YAML script

Now that we have an unpacked solution checked into version control we can work on automating deployment. As mentioned in the [Unpacking a solution](#unpacking-a-solution) section, I follow the  [GitHub Flow](https://guides.github.com/introduction/flow/) development workflow that assumes anything in the master branch is always deployable. Given that we will build a simple YAML script that performs the following outlined below. For a full explanation of YAML schema for Azure Pipelines check out [aka.ms/yaml](http://aka.ms/yaml).

### Yaml script steps
 - [Create a new build pipeline](#create-a-new-build-pipeline)
 - [Define name, trigger, and pool type](#define-name-trigger-and-pool-type)
 - [Download and install Solution Packager](#download-and-install-solution-packager)
 - [Pack solution from repository](#pack-solution-from-repository) 
 - [Create a build artifact](#create-a-build-artifact ) 
 - [Deploy the build artifact to a target Dynamics 365 CE environment](#deploy-the-build-artifact-to-a-target-dynamics-365-ce-environment)
#### Create a new build pipeline
First and foremost we will need a new build pipeline to start from so let's head over to our Azure DevOps project repository to get this started. 

1. Navigate to your Azure DevOps project repository. For example, *https://dev.azure.com/{username}/D365-CE-DevOps-Tutorial*
2. Click Pipelines, then click Builds.
3. Click New, then click New Build Pipeline
4. On the next screen we will select the location of your unpacked solution: Azure Repos, GitHub or GitHub Enterprise. Note that choosing GitHub requires that you authorize Azure DevOps to access the repository, the behavior otherwise is the same in our build pipelines.
5. 
#### Define name, trigger, and pool type
Our second step will be to setup the basics of our YAML script by defining how we can identify and trigger our build as well as what OS and tool set to use to complete our build.
```YAML
name: $(BuildDefinitionName)-$(Date:yyyyMMdd).$(Rev:.r)

trigger:
- master

pool:
  vmImage: 'vs2017-win2016'
```
Explanation of schema:

 - **name** - represents build number format. Default build numbers are whole number, we can do better than that.
 - **trigger** - specific branch to trigger on, if no branch is provided commits to any branch will trigger continuous integration.
 - **Pool** - Essentially the type of OS and tools set you want to have your build run on. In this case, we are using Visual Studio 2017 on Windows Server 2016, there are other [available build agents](https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/hosted?view=azure-devops&tabs=yaml#use-a-microsoft-hosted-agent) as well.

#### Download and install Solution Packager
Our build agent is provided to us as a blank work space so we will need to download and install the necessary tools to complete our build. To install Solution Packager we will need to download and install Nuget, then install the [Dynamics 365 CE Core Tools Nuget package](https://www.nuget.org/packages/Microsoft.CrmSdk.CoreTools).
 
```YAML
steps:
- script: md tools
  displayName: 'Create tools directory'

- powershell: |
    Invoke-WebRequest `
      -Uri https://dist.nuget.org/win-x86-commandline/latest/nuget.exe `
      -OutFile tools\\nuget.exe
  displayName: 'Download nuget.exe'

- powershell: |
    tools\\nuget.exe install Microsoft.CrmSdk.CoreTools -O tools
    md "tools\\CoreTools"
    $coreToolsFolder = Get-ChildItem tools | Where-Object {$_.Name -match 'Microsoft.CrmSdk.CoreTools.'}
    move "tools\\$coreToolsFolder\\content\\bin\\coretools\\*.*" "tools\\CoreTools"
    Remove-Item "tools\\$coreToolsFolder" -Force -Recurse
  displayName: 'Install CoreTools'
```

#### Pack Solution from repository 
While our extracted solution is ideal for version control it's not going to help us with importing our solution into downstream environments. We will need to pack the solution up, essentially reversing the extraction to recreate our original zip file.

```YAML
- powershell: |
    Start-Process tools/CoreTools/SolutionPackager.exe `
    -ArgumentList `
      "/action: Pack", `
      "/zipfile: packedSolution\$env:SolutionName.zip", `
      "/folder: $env:SolutionPath", `
      "/packagetype: Managed" `
    -Wait `
    -NoNewWindow
  env:
    SolutionPath: $(Solution.Path)
    SolutionName: $(Solution.Name)
  displayName: 'Solution Packager: pack solution'
```
In the code above you will have noticed that there is now and environment variable section (env) that contains two variables *SolutionPath* and *SolutionName*. Both of the variables are defined in our Azure DevOps pipeline as *Solution.Path* and *Solution.Name* and allow us to define the path to our extracted solution within our repository and the desired output name of our solution e.g. *ContosoUniversity.zip*. Simply copying and pasting this script will not work so we will need to manually create theses variables in our pipeline using the steps below.

##### Steps to create pipeline variables
1. Navigate to your Azure DevOps repository. For example, *https://dev.azure.com/{username}/D365-CE-DevOps-Tutorial*
2. Click Pipelines, then click Builds.
3. 
#### Create a build artifact
```YAML
- task: CopyFiles@2
  inputs:
    contents: 'packedSolution**\*'
    targetFolder: $(Build.ArtifactStagingDirectory)
  displayName: 'Copy packed solution to artifact staging directory'

- task: PublishBuildArtifacts@1
  inputs:
    pathtoPublish: $(Build.ArtifactStagingDirectory)
    artifactName: drop

```
#### Deploy the build artifact to a target Dynamics 365 CE environment


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
eyJoaXN0b3J5IjpbMTQ0NjkyMjg3Myw3MDAxNjMzMzksLTE5ND
c2ODY4NzksLTEzNjk5OTIzOTgsLTM0OTI4Nzk0MiwxMDMzMjI2
MDIxLDk0MTM3MTg1MSwtMTMwMjA3ODQzOSwtMjA2Njk2NzIwMi
w1ODc0NzU4NzEsMjAyNTIyMDY2NSwtNjk5MDc4MDkwLC0xMjQw
MTQ3NDgxLC0xNDIzMjU0NzQsLTExOTUzMjk1NDgsMTA2NjA2Mj
Q5NCwxMTQ5MDA2OTczLC0yMDU1MTQ4ODE0LDEzNjQyMjEzNjAs
MTA0ODkyNTc3MF19
-->