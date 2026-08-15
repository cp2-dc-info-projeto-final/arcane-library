<script lang="ts">
  import { Card, Button, Label, Input, Heading, Select, Modal, Alert } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import api from '$lib/api';
  import type { ApiFieldError, ApiResponse } from '$lib/api';
  import { goto } from '$app/navigation';
  import { ArrowLeftOutline, FloppyDiskAltOutline } from 'flowbite-svelte-icons';
  import type { Categorias, CategoriasFormData } from '$lib/models/Categorias';
  import { getToken } from "$lib/auth";
  import { themeStore, themes, type Season } from '$lib/themeStore';