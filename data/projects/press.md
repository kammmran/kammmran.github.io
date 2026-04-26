# What is Press?




About eight months ago (around August 2025), I built a free journal website for my university. Around the same time, I also created another website, although it was not very useful in practice.

Later, I discovered that a group of people at the university had already been trying to develop a new journal management system. They asked me to help them build the website and assist with organizing and managing the process. Although it was my first experience working on such a project, I believed I could contribute.

Since I was already employed by the same university, I prepared a detailed plan explaining how the journals could be managed and what the best approach would be to merge them into a single system. I called this concept **“Press.”**

The term *Press* is widely used internationally for journal publishing systems, but in Azerbaijan this was one of the first attempts to use such a concept to merge multiple journal websites under one unified system.

The idea was accepted, although not all parts of the plan were implemented.

## Initial Analysis

My first step was to analyze the existing situation of the journals. There were four journals in total.

- Two of them were in very poor condition and lacked proper structure or management.
- The other two were relatively strong, mainly because their Editors-in-Chief were experienced and high-quality professionals.

## Phase 1 – Django System

In the first phase, I built a system using **Django** as the backend framework. The goal was to merge the journals into a single platform and create an editorial management system.

My main priority was to keep everything simple and easy to use for editors and staff.

However, several challenges appeared during this process. One major issue was that many people involved in the workflow did not fully understand their roles. They were performing tasks without clearly knowing the purpose or process behind them.

Despite these challenges, I managed to build several components:

1. Designed journal covers for two journals.
2. Built the main journal website using Django.
3. Developed an editorial management system.

The website and the editorial management system were built as separate components. Technically, they did not need to be fully merged; communication through APIs and requests would have been sufficient.

Unfortunately, the university’s IT infrastructure created additional problems. The server provided by the HPC environment was difficult to manage, and I did not have enough information or permissions to configure ports and firewall settings properly. For example, I opened port 80 to make the system accessible on the internet, but later I was advised not to do so.

## Phase 2 – Migration to PHP

Because of the infrastructure limitations and internal IT policies, I eventually migrated the backend from Django to **PHP**, since the university’s main website infrastructure is based on PHP.

At least this allowed the website to run reliably on the internet.

During this stage I completed the following:

1. Updated the journal covers.
[Image 1](media/press/ajcnews_new.png)
[Image 2](media/press/pahtei_new.png)
2. Redesigned the website interface.
3. Rewrote the backend using PHP.
4. Built a more user-friendly database structure.
5. Created a visual interface to manage the system.

Final website link : [Click](https://press.asoiu.edu.az/)
## Current Situation

Eventually, I had to stop development because the IT department did not allow further code deployment.

Despite these limitations, I believe the project achieved meaningful results.

Currently, I serve as an **editor of one of the journals** and manage the process of applying for indexing in **DOAJ** and **Scopus**.

This work is especially interesting because the Editor-in-Chief of the journal is a very knowledgeable and capable person, which makes the collaboration productive and motivating.



