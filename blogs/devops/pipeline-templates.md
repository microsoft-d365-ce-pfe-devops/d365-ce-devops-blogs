# Refactoring Pipelines and Using YAML to Unpack Dynamics 365 for Customer Engagement Solutions

Welcome to the next entry in our blog series on [DevOps for Dynamics 365 for Customer Engagement ](https://blogs.msdn.microsoft.com/crminthefield/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines/). Last time, we covered the following:

1. Unpacking solutions into source control.
2. Using Pipelines to pack solutions and import them into a target environment.

In this article, we will revisit those steps and delve further into how we can use Azure DevOps to automate solution management.

**TODO** Introduction

## Making Pipelines Reusable

It is very likely your Dynamics 365 CE deployment will consist of more than one solution. While the components that comprise your solution may be different, the pipelines you use to deploy these solutions will be quite similar, if not completely identical. That said, it would be a shame if we were to start copying and pasting our code while implementing DevOps.


There are many strategies for organizing your Dynamics 365 CE solution architecture in source control. We will be exploring some of them in later blog posts, but for the purposes for this article, let's assume that we've landed on a strategy in which we store our pipeline templates in a separate repository. You can import/fork [our pipeline repository](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-Pipelines), or create your own.

### Introducing Job Templates

[Job templates](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema#job-templates) let us build reusable sequences of steps. This gives us the power to effectively templatize our pipelines.

```YAML
jobs:
- job: PackImportSolution
  pool:
    vmImage: 'vs2017-win2016'
  steps:
```
*Excerpt from [jobs/pack-import-solution.yml](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-Pipelines/blob/master/jobs/pack-import-solution.yml)*

### Refactoring Pipelines

Later on, we will be creating a new pipeline to automate unpacking solutions. The first step in that pipeline is going to install Solution Packager, but [we've already done that](https://blogs.msdn.microsoft.com/crminthefield/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines/#download-and-install-solution-packager). So let's look at how we can reuse those steps without the guilt of copying and pasting code.

#### Introducing Step Templates

While job templates provide a way to build reusable sequences of tasks, [step templates](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema#step-template) allow us to create granular sequences of tasks that can be consumed by our pipelines and jobs. This opens a realm of possibilities for writing clean, reusable YAML. Let's start with a simple template for installing the core tools (which includes Solution Packager):

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
*[steps/install-core-tools.yml](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-Pipelines/blob/master/steps/install-core-tools.yml)*

Now, in our job template for packing a solution, we can reference this template in place of the steps we'd written previously:

```YAML
steps:
- template: ../steps/install-core-tools.yml
```
*Excerpt from [jobs/pack-import-solution.yml](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-Pipelines/blob/master/jobs/pack-import-solution.yml)*

### Referencing a Pipeline Repository From a Build Pipeline

Since the job template we created is stored in a separate repository, we won't be able to reference it simply using a relative path like we did for the step template. Instead, we will need to make available by adding a [repository resource](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema#repository-resource) to our pipeline.

```YAML
name: $(BuildDefinitionName)-$(Date:yyyyMMdd).$(Rev:.r)

trigger:
- master

resources:
  repositories:
    - repository: templates
      type: github
      name: microsoft-d365-ce-pfe-devops/D365-CE-Pipelines
      endpoint: microsoft-d365-ce-devops

jobs:
- template: jobs/pack-import-solution.yml@templates
```
*[pack-import-solution.yml](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-DevOps-Tutorial/blob/master/Lesson-2/pack-import-solution.yml)*

Note that if you are using an Azure Repo (`type: git`), you will not need to specify an `endpoint`. If you are using GitHub for your repository, you will need to create a service endpoint if you don't have one already.

### Using Variable Groups

In our last article, we introduced the concept of variables in our pipelines. Variables allow us to parameterize a pipeline for each time it is run, and provide a secure way for us to store sensitive information, such as passwords or tokens.

Often times, a variable will be scoped much further than the lifetime of one pipeline. For example, a service account's credentials will be reused by many pipelines. In order to reuse the values of variables, we organize them in our libraries as variable groups.

#### Steps to Create a Variable Group

1. Click or hover over *Pipelines*, click *Library*.
2. Click *+ Variable Group*.
3. Type a name for your variable group under *Variable group name:*. In this example, we are going to be replacing the variables we use for the Dynamics 365 CE service account we created in the last article, so our name should somehow reflect that.
4. Click *+ Add* to start adding variables to the group.
5. When done, click *Save*.

![Create a Variable Group Demo](../../media/devops/create-variable-group.gif)

The variable group will not be available to our pipeline until we link it to our pipeline.

#### Steps to Link a Variable Group to a Pipeline

1. Click or hover over *Pipelines*, click *Builds*.
2. Click the pipeline you want to modify.
3. Click *Edit*.
4. Click on the vertical ellipsis at the top-right corner, click *Variables*.
5. Click *Variable groups*.
6. Click *Link variable group*.
7. Select the variable group you want to link, and then click *Link*.
8. Save your changes.

![Create a Variable Group Demo](../../media/devops/link-variable-group.gif)

Now that we've invested some time in making our pipeline code reusable, let's capitalize on our investment and add another pipeline to our belt.

## Unpack Dynamics 365 CE Solution Into Source Control

In the last article, we walked through [using the solution packager](https://blogs.msdn.microsoft.com/crminthefield/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines/#download-solution-packager) to unpack solutions exported from Dynamics 365 CE into a folder structure for tracking in source control. Let's continue this effort by automating these steps in a pipeline. This gives us the following benefits:

- Automation of repetitive steps.
- Freedom from client-side development tooling.
- Empowerment to non-developers (e.g. business analysts) to commit changes to source control.

This pipeline will need to perform the following:

1. [Check out the solution repository for editing.](#working-with-git-in-a-yaml-pipeline)
2. Export the solution ZIP files (both managed and unmanaged) from Dynamics 365 CE
3. Unpack the solution files into the solution directory.
4. Commit and push the changes back into the repository.

### Working With Git in a YAML Pipeline

When a pipeline runs, it checks out the remote repository for read only. We will need to escalate our credentials so that we can make changes to the local repository and commit and push them back to the remote repo. 

### Export Solution From Dynamics 365 CE

The first step in the last article was to manually export the solution from our source environment. We will now replicate those steps in our YAML pipeline.

**TODO**
- Insert GIF for importing Pipeline Repository.
- Tag Pipeline repository for Lesson 2