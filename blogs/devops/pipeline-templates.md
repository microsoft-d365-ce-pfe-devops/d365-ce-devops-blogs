# Refactoring Pipelines and Using YAML to Unpack Dynamics 365 for Customer Engagement Solutions 

Welcome to the next entry in our blog series on [DevOps for Dynamics 365 for Customer Engagement](https://blogs.msdn.microsoft.com/crminthefield/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines/). Last time, we covered the following:

1. Unpacking solutions into source control.
2. Using Pipelines to pack solutions and import them into a target environment.

In this article, we will revisit those steps and delve further into how we can use Azure DevOps to automate solution management.

## Refactoring Pipelines

Later on, we will be creating a new pipeline to automate unpacking solutions. The first step in that pipeline is going to install Solution Packager, but [we've already done that](https://blogs.msdn.microsoft.com/crminthefield/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines/#download-and-install-solution-packager). So let's look at how we can re-use those steps without the guilt of copying and pasting code.

### Introducing Step Templates

[Step templates](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema#step-template) allow us to pull one or more steps from another file into our main pipeline. This opens a realm of possibilities for writing clean, re-usable YAML. Let's start with a simple template for installing the core tools (which includes Solution Packager):


[steps/install-core-tools.yml](https://github.com/paulbreuler/D365-CE-DevOps-Tutorial/blob/master/Lesson-2/steps/install-core-tools.yml)
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

[pack-import-solution.yml](https://github.com/paulbreuler/D365-CE-DevOps-Tutorial/blob/master/Lesson-2/pack-import-solution.yml)
```YAML
#...

steps:
- template: steps/install-core-tools.yml

#...
```

### Making Pipelines Re-usable

In a future blog post, we will be adding more solutions to our architecture, and we will be using the same pipelines we've built for those solutions as well.