# Refactoring Pipelines and Using YAML to Unpack Dynamics 365 for Customer Engagement Solutions

Welcome to the next entry in our blog series on [DevOps for Dynamics 365 for Customer Engagement](https://blogs.msdn.microsoft.com/crminthefield/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines/). Last time, we covered the following:

1. Unpacking solutions into source control.
2. Using Pipelines to pack solutions and import them into a target environment.

In this article, we will revisit those steps and delve further into how we can use Azure DevOps to automate solution management.

## Refactoring Pipelines

Later on, we will be creating a new pipeline to automate unpacking solutions. The first step in that pipeline is going to install Solution Packager, but [we've already done that](https://blogs.msdn.microsoft.com/crminthefield/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines/#download-and-install-solution-packager). So let's look at how we can re-use those steps without the guilt of copying and pasting code.

### Introducing Step Templates

[Step templates](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema#step-template) allow us to pull one or more steps from another file into our main pipeline. This opens a realm of possibilities for writing clean, re-usable YAML. Let's start with a simple template for installing the core tools (which includes Solution Packager):

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
*Excerpt from: [pack-import-solution.yml](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-Pipelines/blob/master/pack-import-solution.yml)*

### Making Pipelines Re-usable

In future blog posts, we will be adding more solutions to our architecture. There are many strategies for organizing your Dynamics 365 solution architecture in source control. For the purposes for this article, we will assume that we are creating a separate repository for each solution. Furthermore, we will create a separate repository for our pipeline templates. You can import our pipeline repository, our create your own.

#### Import a Pipeline Repository

1. Open your existing Azure DevOps project.
2. Click *Repos*
3. Click the currently selected repository at the top, and click *Import repository*.
4. Make sure that *Source type* is set to *Git*, and for the clone URL, insert the URL to your repository, or use ours at https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-Pipelines.
5. Give the new repository a name (e.g. "Pipelines").
6. Click *Import*.

**TODO**
- Insert GIF for importing Pipeline Repository.
- Tag Pipeline repository for Lesson 2