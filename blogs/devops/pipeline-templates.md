# Refactoring Pipelines and Using YAML to Unpack Dynamics 365 for Customer Engagement Solutions

Welcome to the next entry in our blog series on [DevOps for Dynamics 365 for Customer Engagement ](https://blogs.msdn.microsoft.com/crminthefield/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines/). Last time, we covered the following:

1. Unpacking solutions into source control.
2. Using Pipelines to pack solutions and import them into a target environment.

In this article, we will revisit those steps and delve further into how we can use Azure DevOps to automate solution management.

## Refactoring Pipelines

Later on, we will be creating a new pipeline to automate unpacking solutions. The first step in that pipeline is going to install Solution Packager, but [we've already done that](https://blogs.msdn.microsoft.com/crminthefield/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines/#download-and-install-solution-packager). So let's look at how we can reuse those steps without the guilt of copying and pasting code.

### Introducing Step Templates

[Step templates](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema#step-template) allow us to pull one or more steps from another file into our main pipeline. This opens a realm of possibilities for writing clean, reusable YAML. Let's start with a simple template for installing the core tools (which includes Solution Packager):

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

Now, in our pipeline for packing a solution, we can reference this template in place of the steps we'd written previously:

```YAML
steps:
- template: steps/install-core-tools.yml
```
*Excerpt from [jobs/pack-import-solution.yml](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-Pipelines/blob/master/jobs/pack-import-solution.yml)*

### Making Pipelines Reusable

In future blog posts, we will be adding more solutions to our architecture. There are many strategies for organizing your Dynamics 365 CE solution architecture in source control. For the purposes for this article, we will assume that we are creating a separate repository for each solution. Furthermore, we will create a separate repository for our pipeline templates. You can import/fork [our pipeline repository](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-Pipelines), or create your own.

#### Introducing Job Templates

While step templates provide a way to build modular, reusable tasks, [job templates](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema#job-templates) let us build reusable sequences of steps. This effectively gives us the power to templatize our pipelines.

```YAML
jobs:
- job: PackImportSolution
  pool:
    vmImage: 'vs2017-win2016'
  steps:
```
*Excerpt from [jobs/pack-import-solution.yml](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-Pipelines/blob/master/jobs/pack-import-solution.yml)*



#### Referencing a Pipeline Repository From a Build Pipeline

Depending on whether you are using Azure Repos

## Unpack Dynamics 365 CE Solution Into Source Control

In the last article, we walked through [using the solution packager](https://blogs.msdn.microsoft.com/crminthefield/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines/#download-solution-packager) to unpack solutions exported from Dynamics 365 CE into a folder structure for tracking in source control. Let's continue this effort by automating these steps in a pipeline. This gives us the following benefits:

- Automation of repetitive steps.
- Freedom from client-side development tooling.
- Empowerment to non-developers (e.g. business analysts) in committing changes to source control.

### Working With Git in a YAML Pipeline

When a pipeline runs, it checks out 

The first step will be to install the [Microsoft.Xrm.Data.PowerShell module](https://www.powershellgallery.com/packages/Microsoft.Xrm.Data.Powershell/), which we did both as a manual step and in a pipeline in the last step. Since this already exists as an automated step, we will pull it out into a reusable step template as we did above.

### Export Solution From Dynamics 365 CE

The first step in the last article was to export the solution from our source environment.

We will be reusing some code from our pack-import-solution.yml pipeline

**TODO**
- Insert GIF for importing Pipeline Repository.
- Tag Pipeline repository for Lesson 2