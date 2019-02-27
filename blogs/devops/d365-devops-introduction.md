
# Introduction to DevOps for Dynamics 365 Customer Engagement
  
In this blog series, we will explore building out DevOps processes and practices for Dynamics 365 Customer Engagement (CE) by utilizing YAML based Azure Pipelines.  In this first blog, we will cover version controlling solutions and the basics of automating deployment.

What is DevOps?
>DevOps is the union of people, process, and products to enable continuous delivery of value to our end users. The contraction of “Dev” and “Ops” refers to replacing siloed Development and Operations to create multidisciplinary teams that now work together with shared and efficient practices and tools. Essential DevOps practices include agile planning, continuous integration, continuous delivery, and monitoring of applications. (Sam Guckenheimer, [What is DevOps?](https://docs.microsoft.com/en-us/azure/devops/learn/what-is-devops))
>

## Getting started

If you already have a Dynamics 365 CE environment, Azure DevOps, you're familiar with the basics, and have a solution ready to go skip to [Moving solutions between environments](#moving-solutions-between-environments-using-a-yaml-script). If you are new to all of this, please continue from here. 

The most basic workflow of Dynamics 365 CE development, deployment, and functional testing consists primarily of manual processes. We modify, export, and import a solution(s) into a downstream environment, then manually test to ensure there are no issues with solution layering, integrations, etc. That gets old quick, what we really want is to automate as much as we can. The first step we can take is to implement the practice of version control for our solutions and automate solution imports to various environments. 

**What we will need**

 - Azure Repo
	 - If you are unfamiliar with Azure DevOps and need to set up a new account please start with the [Get started guide for Azure Repos](https://docs.microsoft.com/en-us/azure/devops/repos/get-started/?view=azure-devops) documentation, then come back to this blog.  
 - [Dynamics 365 CE environment trial](https://trials.dynamics.com/) or follow along using your own environment.

**Assumptions**

 - Some experience with customizing Dynamics 365 CE
 - A basic understanding of version control
	 - There are a number of tools to make version control easier such as [GitHub Desktop](https://desktop.github.com/), [Sourcetree](https://www.atlassian.com/software/sourcetree), and [GitKraken](https://www.gitkraken.com/) to name a few. For this series, it is expected that you know the basics or will [learn Git](https://try.github.io/) for version control.

## Version control for solutions

Solutions in Dynamics 365 CE are in essence a package containing any customization we've done to our environment that we can export from one environment then import into various environments. When exported from an environment, solutions are in the form of a zip file. When that zip file is unzipped, the output directory contains folders for plugins, web resources, and any workflows we have made as well as XML files defining the schema of any customization we have done. In the zipped format, our schema definition is contained in one massive file. Consider this zip file as a binary, or in layman's terms, a tidy package with a fancy bow, i.e. It may look nice but it's not easy to see what's inside and it's a poor format for version control. 

Enter [Solution Packager](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/compress-extract-solution-file-solutionpackager). Solution packager essentially takes our Dynamics 365 CE solution zip file and breaks it out into a logical folder structure by decomposing the contents. The resulting output shows a more granular view of our solution and is considerably more friendly for version control as you can see from the example screenshots below.

#### Example zip file directory structure

![Example zip file directory structure](https://github.com/paulbreuler/d365-ce-devops-blogs/blob/DevOps-Intro-Blog/media/devops/zip-file-dir-structure.png?raw=true)

#### Example extracted solution directory structure

![Example extracted solution directory structure](https://github.com/paulbreuler/d365-ce-devops-blogs/blob/DevOps-Intro-Blog/media/devops/ext-solution-dir-structure.png?raw=true)

**Note**: 
- The extra granularity of an unpacked solution makes it ideal for team development. Developers can pack and import a solution from a repository into their various development environments, make changes, export, unpack, and commit the solution back to the repository. For more on the benefits of using solution packager and example scenarios check out the article  [Use source control with solution files](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/use-source-control-solution-files)  on Microsoft Docs. 
- Solution Packager does not completely remove merge conflicts but does make it easier to manage them.

### Download solution packager

To get started we will need to download a copy of the [Dynamics 365 CE Core Tools Nuget package](https://www.nuget.org/packages/Microsoft.CrmSdk.CoreTools) locally, this package includes Solution Packager. 

#### Steps to download

1. Open a PowerShell Terminal
2. Navigate to the directory that you want the tools downloaded to. 
	- Note that the code below will create the folder structure *Tools\CoreTools* in the current directory
4. Copy & paste the code below into the terminal or new script window if using PowerShell ISE and run the script.

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

Now that we have Solution Packager downloaded we can work on adding our solution to version control. If you are following along with your own setup you will need to export a solution from your environment as both *managed* and *unmanaged*. It is recommended to use an *unmanaged* solution for development purposes and *managed* for all other environments. If you do not have a solution file handy grab a copy of our example unpacked solution from our [GitHub repo](https://github.com/paulbreuler/D365-CE-DevOps-Tutorial) in the *Lesson-1* folder. Note that Azure DevOps build pipelines integrate with Azure Repos, GitHub, and GitHub Enterprise repository. In this example, I am using GitHub. 

#### PowerShell command to extract Dynamics 365 CE solution:

The following PowerShell command allows us to extract both our *managed* and *unmanaged* solution files, this is accomplished by setting the *packagetype* to *both* and the zipfile value to the path to our *unmanaged* solution zip file. Solution packager will search the same directory for a solution file with the name containing the *unmanaged* solution name but ending in *_managed.zip*, for example, *contoso.zip* and *contoso_managed.zip*.

```PowerShell
.\Tools\CoreTools\SolutionPackager.exe /action extract /packagetype both /zipfile <path to file>\contoso.zip /folder <path to output directory>
```
Once unpacked, submit the output to version control. 

## Moving solutions between environments using a YAML script

Now that we have an unpacked solution and it has been checked into version control we can work on automating deployment. I tend to follow the [GitHub Flow](https://guides.github.com/introduction/flow/) development workflow that assumes anything in the master branch is always deployable. Following this pattern, we will build a simple YAML script that triggers on commits to the master branch and performs the steps outlined below. For a full explanation of YAML schema for Azure Pipelines check out [aka.ms/yaml](http://aka.ms/yaml).

### Yaml script steps

 - [Create a new build pipeline](#create-a-new-build-pipeline)
 - [Define name, trigger, and pool type](#define-name-trigger-and-pool-type)
 - [Download and install Solution Packager](#download-and-install-solution-packager)
 - [Pack solution from repository](#pack-solution-from-repository) 
 - [Publish build artifacts](#publish-build-artifacts ) 
 - [Import solution into target environment](#import-solution-into-target-environment)
 
#### Create a new build pipeline

First and foremost we will need a new build pipeline, so let's head over to our Azure DevOps project repository to get this started. 

1. Navigate to your Azure DevOps project repository. For example, *https://dev.azure.com/{username}/D365-CE-DevOps-Tutorial*
2. Click *Pipelines*, then click *Builds*.
3. Click *New*, then click *New Build Pipeline*
4. On the next screen, we will select the location of your unpacked solution: Azure Repos, GitHub, or GitHub Enterprise. Note that choosing GitHub requires that you authorize Azure DevOps to access the repository, the behavior otherwise is the same in our build pipelines.
5. Select the repository containing the unpacked solution files.
6. Configure pipeline using the Starter pipeline option. 

*Note that choosing starter pipeline will name you file azure-pipelines.yml so you'll want to remain the file later and update the path in your pipeline settings.

![Example pipeline setup using GitHub repo](https://github.com/paulbreuler/d365-ce-devops-blogs/blob/DevOps-Intro-Blog/media/devops/create-new-build-pipeline.gif?raw=true)

#### Define name, trigger, and pool type

Now that a basic pipeline has been set up we can begin building out the steps needed to pack and deploy our solution file. For this example, we will be using the build pipelines only as YAML support for release pipelines is still under development at the time of writing. 

We can start by deleting the contents of the starter template and adding our own definitions for the build name, trigger, and pool.

```YAML
name: $(BuildDefinitionName)-$(Date:yyyyMMdd).$(Rev:.r)

trigger:
- master

pool:
  vmImage: 'vs2017-win2016'
```
Explanation of schema:

 - **Name** - represents build number format. Default build numbers are whole numbers, we can do better than that.
 - **Trigger** - specific branch to trigger on, if no branch is provided, commits to any branch will trigger continuous integration.
 - **Pool** - essentially the type of OS and tools set you want to have your build run on. In this case, we are using Visual Studio 2017 on Windows Server 2016, but there are other [available build agents](https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/hosted?view=azure-devops&tabs=yaml#use-a-microsoft-hosted-agent) as well.

#### Download and install Solution Packager

A build agent is provided to us as a blank workspace, so we will need to download and install the necessary tools to complete our build. We will first download and install Nuget so that we can install the [Dynamics 365 CE Core Tools Nuget package](https://www.nuget.org/packages/Microsoft.CrmSdk.CoreTools). Solution Packager resides in the core tools package and is nested down a few levels. Rather than deal with a long string to point to SolutionPackager.exe, we will do some clean up to make it easier to reference the tool and to make this step easier to reuse in the future. 

Append the following code the pipeline script, if you get a syntax error ensure *Steps* is not indented. 
 
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
Note that script above is essentially the same as the script we used in the [Download solution packager](#download-solution-packager) section.

Save and run to ensure your setup is correct and make adjustments as needed.

#### Pack Solution from repository 

With Solution Packager installed we can turn our attention to packing up our extracted solution for importing into our target environment(s). To do that we will need to pack the solution back into its original zip file state using, this can be accomplished by reversing the extraction process we completed earlier in this blog. 

```YAML
- powershell: |
    Start-Process tools/CoreTools/SolutionPackager.exe `
    -ArgumentList `
      "/action: Pack", `
      "/zipfile: $(Build.ArtifactStagingDirectory)\packedSolution\$env:SolutionName.zip", `
      "/folder: $env:SolutionPath", `
      "/packagetype: Both" `
    -Wait `
    -NoNewWindow
  env:
    SolutionPath: $(solution.path)
    SolutionName: $(solution.name)
  displayName: 'Solution Packager: pack solution'
```

- **/action** - available options are pack and extract
- **/zipfile** - the location and desired name of packed solution zip file. 
	- $(Build.ArtifactStagingDirectory) is a predefined build variable that points to a directory that is purged with each new build so no need for cleanup in our script. 
- **/folder** - the location of our unpacked solution that will be packed.
- **/packagetype** - Defines whether the solution should be packed as managed or unmanaged. `Both` will create both unmanaged and managed solution zip files.

In the code above you will have noticed that there is now an environment variable section, env, that contains two variables: `SolutionPath` and `SolutionName`. These variables allow us to define the path to our extracted solution and desired packed zip file name. We will define the variables in our pipeline settings variables tab and enable the variables for modification at queue time. Note that the solution name that you provide is a friendly name, the actual unique name and localized name(s) that will be used in Dynamics are stored in the solution.xml file of the packed and unpacked solution.

##### Steps to create pipeline variables

For our script to be able to access the variables defined in our script, we will need to manually create them in our pipeline settings using the following steps:

*Don't forget to click *Save and run* before attempting to navigate away.

1. Click the ellipsis (…) on the top right of the page and in the drop-down click *Pipeline settings*, this will take you to the visual pipeline designer.
2. Click the *Variables* tab.
3. Click *+ Add* in the pipeline variables view to add a new variable.
4. Perform step 3 twice and add the following variables
	- **name**: `solution.name`
		- **value**: <desired zip file name. In this example, *contosoUniversity*>
	- **name**:  `solution.path`
		- **value**: <path to repository location of extracted solution. in this example, *Lesson-1/ExtractedSolution/*>
5. Checkmark both as *Settable at queue time*
6. Click the *Save & queue* drop down and click Save 
7. Enter a comment and click *Save* 

*If you queue your build ensure the branch where your YAML file is saved is correct or you may get an error. Or navigate back to the pipeline YAML editor and run from there. 

![Add pipeline variables demo](https://github.com/paulbreuler/d365-ce-devops-blogs/blob/DevOps-Intro-Blog/media/devops/add-pipeline-variables.gif?raw=true)


#### Publish build artifacts

Next, we are going to publish our build artifacts even though release pipelines are not available for YAML builds at the time of writing this blog. In a future update, we will be moving our solution imports to a release pipeline and start breaking our script out into templates. For now, on build completion, you will be able to see and download the artifacts and the build will handle imports.

```YAML
- task: PublishBuildArtifacts@1
  inputs:
    pathtoPublish: $(Build.ArtifactStagingDirectory)
    artifactName: drop
  displayName: 'Publish build artifacts'
```
Save and run to ensure your setup is correct. again, ensure you don't have extra spaces as the script is space sensitive. You can click the build queue notification message to see the build steps run in real-time and view the execution history. Once the build is complete, you should see a new button labeled *Artifacts* on the top left of the page. Click this drop-down to view and download your solution file artifact(s). Clicking *Release* will automatically add build artifacts from this build to your release pipeline, for this blog we will not be doing this because YAML for release pipelines is not out yet. 

#### Import solution into target environment

Finally! Let's deploy our solution to an environment. 

The following snippet will download and install [Microsoft.Xrm.Data.Powershell](https://github.com/seanmcne/Microsoft.Xrm.Data.PowerShell), then perform a synchronous import of our managed solution. 

```YAML
- powershell: Install-Module Microsoft.Xrm.Data.Powershell -Scope CurrentUser -Force
  displayName: 'Install Microsoft.Xrm.Data.PowerShell'

- powershell: |
    $connection = Get-CrmConnection `
      -ConnectionString `
        ("AuthType = Office365;" + `
        "Username = $env:ServiceAccountUpn;" + `
        "Password = $env:ServiceAccountPassword;" + `
        "Url = https://$env:EnvironmentName.crm.dynamics.com")

    Import-CrmSolution `
      -conn $connection `
      -SolutionFilePath $(Build.ArtifactStagingDirectory)\packedSolution\$($env:SolutionName)_managed.zip
  env:
    EnvironmentName: $(environment.name)
    SolutionName: $(solution.name)
    ServiceAccountUpn: $(serviceAccount.upn)
    ServiceAccountPassword: $(serviceAccount.password)
  displayName: 'Import solution'
```
**Important** - We have added some environment variables so we will need to edit our pipeline settings once more following the steps in the [Steps to create pipeline variables](#steps-to-create-pipeline-variables) section.

This time for step 4 we will add 3 new variables
- **name**: `environment.name`
		- **value**: <Dynamics 365 CE org name e.g. **contoso**.crm.dynamics.com, name only>
- **name**: `serviceAccount.upn`
	- **value**: <example@contoso.onmicrosoft.com>
- **name**: `serviceAccount.password`
	- **value**: hopefully not [hunter2](http://bash.org/?244321=) 
	- For password variable be sure to select the lock symbol to change the type of the field to secret.

*Mark variables that you want to modify at queue time to settable at queue time.

![Example extracted solution directory structure](https://github.com/paulbreuler/d365-ce-devops-blogs/blob/DevOps-Intro-Blog/media/devops/pipeline-settings-variables.png?raw=true)

That's it, now you can click *Save and run* on the top left of the editor. Once the build has been kicked off click the build name in the notification banner to watch the build run. After the build has successfully completed your solution will be imported into the specified target environment and that's that. 

Stay tuned for more blogs that improve and build upon this example setup.

If you are interested in this topic and would like to do some further self-study I encourage you to check out the [Solution Lifecycle Management: Dynamics 365 for Customer Engagement apps](https://www.microsoft.com/en-us/download/details.aspx?id=57777) white paper. 

*[CE]: Customer Engagement
<!--stackedit_data:
eyJoaXN0b3J5IjpbLTEyNDY3MDc2MTEsMTA3NDY4Njg0OSw5ND
M3MDIwMjksLTExMDgwNDU2MTgsLTI5MDE1MTU1NCwxMTQwNDc1
NTQ1LDkwMDcyNjU1Nyw5NjA5NTY3MywtODA1MTExNDEwLC0yMT
I3OTg5MTc4LC05MzY5MzIwNTQsMTU4MjYwNTIyOSwtMjAwNDA2
NTgzMCwtMTIzNDIwNzkzNiwzNTIzMDE5MzUsMTQ3MjI3OTEyNC
wxNzA3MjA3Mzk3LDE4NjA0MzUxNTksLTY2NTUyNDI4OSwtOTMx
MTI0NjMzXX0=
-->